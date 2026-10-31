
import { spawn } from "node:child_process";
import {
  mkdtemp,
  writeFile,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

import {
  RunnerError,
  validateExecutionRequest,
  createExecutionResult,
} from "./runner.interface.js";

const EXECUTION_TIMEOUT_MS = 3_000;
const MAX_OUTPUT_BYTES = 100_000;

const isModuleSource = (sourceCode, filePath) => {
  if (filePath.endsWith(".mjs")) return true;
  if (filePath.endsWith(".cjs")) return false;

  // Basic first-pass detection for JavaScript ES modules.
  return /^\s*(?:import\s|export\s)/m.test(sourceCode);
};

const getSafeEnvironment = () => {
  // Do not pass the entire server environment to the child process.
  // This is defense-in-depth, NOT a security sandbox.
  const env = {
    NODE_ENV: "production",
  };

  if (process.env.PATH) {
    env.PATH = process.env.PATH;
  }

  if (process.platform === "win32" && process.env.SystemRoot) {
    env.SystemRoot = process.env.SystemRoot;
  }

  return env;
};

export const runJavaScript = async (request) => {
  if (process.env.ALLOW_UNSAFE_LOCAL_EXECUTION !== "true") {
    throw new RunnerError(
      "Local code execution is disabled. Enable it only for trusted code during local development.",
      503
    );
  }

  const validated = validateExecutionRequest({
    ...request,
    language: "javascript",
  });

  const {
    sourceCode,
    stdin,
    filePath,
  } = validated;

  const startedAt = performance.now();

  let tempDirectory;

  try {
    tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "reporunner-")
    );

    const useModules = isModuleSource(sourceCode, filePath);
    const filename = useModules ? "program.mjs" : "program.cjs";
    const programPath = path.join(tempDirectory, filename);

    await writeFile(programPath, sourceCode, {
      encoding: "utf8",
      flag: "wx",
    });

    return await new Promise((resolve) => {
      let stdout = "";
      let stderr = "";
      let outputBytes = 0;
      let timedOut = false;
      let outputLimitExceeded = false;
      let settled = false;
      let timeoutHandle;

      const child = spawn(
        process.execPath,
        [programPath],
        {
          cwd: tempDirectory,
          env: getSafeEnvironment(),
          shell: false,
          windowsHide: true,
          stdio: ["pipe", "pipe", "pipe"],
        }
      );

      const finish = (result) => {
        if (settled) return;
        settled = true;

        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        resolve(
          createExecutionResult({
            ...result,
            durationMs: Math.round(
              performance.now() - startedAt
            ),
          })
        );
      };

      const stopChild = () => {
        if (!child.killed) {
          child.kill("SIGKILL");
        }
      };

      const collectOutput = (stream, chunk) => {
        outputBytes += chunk.length;

        const remaining = Math.max(
          0,
          MAX_OUTPUT_BYTES -
            Buffer.byteLength(stdout) -
            Buffer.byteLength(stderr)
        );

        const accepted = chunk.subarray(0, remaining).toString("utf8");

        if (stream === "stdout") {
          stdout += accepted;
        } else {
          stderr += accepted;
        }

        if (outputBytes > MAX_OUTPUT_BYTES) {
          outputLimitExceeded = true;
          stopChild();
        }
      };

      child.stdout.on("data", (chunk) => {
        collectOutput("stdout", chunk);
      });

      child.stderr.on("data", (chunk) => {
        collectOutput("stderr", chunk);
      });

      child.on("error", (error) => {
        finish({
          status: "launch_error",
          stdout,
          stderr: error.message,
          exitCode: null,
        });
      });

      timeoutHandle = setTimeout(() => {
        timedOut = true;
        stopChild();
      }, EXECUTION_TIMEOUT_MS);

      child.on("close", (exitCode, signal) => {
        if (timedOut) {
          finish({
            status: "timeout",
            stdout,
            stderr:
              `${stderr}\nExecution exceeded the time limit.`.trim(),
            exitCode,
            timedOut: true,
          });
          return;
        }

        if (outputLimitExceeded) {
          finish({
            status: "output_limit",
            stdout,
            stderr:
              `${stderr}\nOutput exceeded the allowed limit.`.trim(),
            exitCode,
          });
          return;
        }

        finish({
          status: exitCode === 0 ? "success" : "runtime_error",
          stdout,
          stderr: signal
            ? `${stderr}\nProcess ended with signal ${signal}.`.trim()
            : stderr,
          exitCode,
        });
      });

      child.stdin.on("error", (error) => {
        // EPIPE can happen if a program exits before consuming input.
        if (error.code !== "EPIPE") {
          stderr += `\nInput error: ${error.message}`;
        }
      });

      child.stdin.end(stdin);
    });
  } catch (error) {
    if (error instanceof RunnerError) {
      throw error;
    }

    throw new RunnerError(
      "Unable to start the JavaScript runner.",
      500
    );
  } finally {
    if (tempDirectory) {
      await rm(tempDirectory, {
        recursive: true,
        force: true,
      }).catch(() => {});
    }
  }
};
