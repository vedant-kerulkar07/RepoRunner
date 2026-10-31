
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
} from "./runner.interface.js";

const EXECUTION_TIMEOUT_MS = Math.max(
  1000,
  Number(process.env.LOCAL_RUNNER_TIMEOUT_MS) || 10000
);

const MAX_OUTPUT_BYTES = 1024 * 1024;

const LANGUAGE_ALIASES = {
  js: "javascript",
  node: "javascript",
  "node.js": "javascript",
  py: "python",
  python3: "python",
  "c++": "cpp",
  ts: "typescript",
  "c#": "csharp",
};

const EXTENSIONS = {
  c: ".c",
  cpp: ".cpp",
  java: ".java",
  python: ".py",
  javascript: ".js",
  typescript: ".ts",
  go: ".go",
  rust: ".rs",
  php: ".php",
  ruby: ".rb",
  csharp: ".cs",
  bash: ".sh",
};

const normalizeLanguage = (language) => {
  const normalized = String(language || "")
    .trim()
    .toLowerCase();

  return LANGUAGE_ALIASES[normalized] || normalized;
};

const makeRunnerError = (message, statusCode = 500) =>
  new RunnerError(message, statusCode);

/**
 * Run one compiler or runtime process.
 * Captures stdout/stderr and enforces time and output limits.
 */
const runProcess = (
  command,
  args,
  {
    cwd,
    stdin = "",
    timeoutMs = EXECUTION_TIMEOUT_MS,
  } = {}
) => {
  return new Promise((resolve, reject) => {
    let child;
    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let timedOut = false;
    let outputLimitReached = false;
    let settled = false;
    let timeout;

    const startedAt = performance.now();

    const finish = (result) => {
      if (settled) return;

      settled = true;
      clearTimeout(timeout);

      resolve({
        ...result,
        stdout,
        stderr,
        durationMs: Math.round(
          performance.now() - startedAt
        ),
        timedOut,
        outputLimitReached,
      });
    };

    try {
      child = spawn(command, args, {
        cwd,
        windowsHide: true,
        shell: false,
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          CI: "true",
          NO_COLOR: "1",
        },
      });
    } catch (error) {
      reject(
        makeRunnerError(
          `Unable to start "${command}": ${error.message}`,
          500
        )
      );
      return;
    }

    timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    const collectOutput = (target, chunk) => {
      if (settled) return;

      const buffer = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk);

      const remaining = MAX_OUTPUT_BYTES - outputBytes;

      if (remaining <= 0) {
        outputLimitReached = true;
        child.kill();
        return;
      }

      const accepted = buffer.subarray(0, remaining);
      const text = accepted.toString("utf8");

      if (target === "stdout") {
        stdout += text;
      } else {
        stderr += text;
      }

      outputBytes += accepted.length;

      if (buffer.length > remaining) {
        outputLimitReached = true;
        child.kill();
      }
    };

    child.stdout.on("data", (chunk) => {
      collectOutput("stdout", chunk);
    });

    child.stderr.on("data", (chunk) => {
      collectOutput("stderr", chunk);
    });

    child.on("error", (error) => {
      if (settled) return;

      settled = true;
      clearTimeout(timeout);

      if (error.code === "ENOENT") {
        reject(
          makeRunnerError(
            `Required runtime or compiler "${command}" was not found. Install it and ensure it is available on PATH.`,
            503
          )
        );
        return;
      }

      reject(
        makeRunnerError(
          `Unable to start "${command}": ${error.message}`,
          500
        )
      );
    });

    child.on("close", (code, signal) => {
      finish({
        exitCode: code,
        signal,
      });
    });

    child.stdin.on("error", (error) => {
      // EPIPE can occur when a program exits before consuming stdin.
      if (
        error.code !== "EPIPE" &&
        !settled
      ) {
        stderr += `\nInput error: ${error.message}`;
      }
    });

    child.stdin.end(stdin);
  });
};

const getJavaClassName = (sourceCode) => {
  const publicClass = sourceCode.match(
    /\bpublic\s+(?:(?:abstract|final)\s+)?class\s+([A-Za-z_$][\w$]*)/
  );

  if (publicClass) {
    return publicClass[1];
  }

  const anyClass = sourceCode.match(
    /\bclass\s+([A-Za-z_$][\w$]*)/
  );

  return anyClass?.[1] || "Main";
};

const getExecutionPlan = ({
  language,
  sourcePath,
  sourceCode,
  workDir,
}) => {
  const extension = EXTENSIONS[language];

  if (!extension) {
    throw makeRunnerError(
      `Unsupported programming language: ${language}.`,
      415
    );
  }

  const baseName = path.basename(
    sourcePath || `program${extension}`
  );

  const safeName = baseName.replace(
    /[^A-Za-z0-9_.-]/g,
    "_"
  );

  let sourceName = safeName;

  if (language === "java") {
    sourceName = `${getJavaClassName(sourceCode)}.java`;
  } else if (
    !sourceName.toLowerCase().endsWith(extension)
  ) {
    sourceName = `program${extension}`;
  }

  const sourceFile = path.join(workDir, sourceName);

  const executable = path.join(
    workDir,
    process.platform === "win32"
      ? "program.exe"
      : "program"
  );

  const sourceArg = path.basename(sourceFile);

  switch (language) {
    case "javascript":
      return {
        sourceFile,
        compile: null,
        command: "node",
        args: [sourceArg],
      };

    case "python":
      return {
        sourceFile,
        compile: null,
        command: "python",
        args: [sourceArg],
      };

    case "c":
      return {
        sourceFile,
        compile: {
          command: "gcc",
          args: [sourceArg, "-o", executable],
        },
        command: executable,
        args: [],
      };

    case "cpp":
      return {
        sourceFile,
        compile: {
          command: "g++",
          args: [
            sourceArg,
            "-o",
            executable,
            "-std=c++17",
          ],
        },
        command: executable,
        args: [],
      };

    case "java": {
      const className = path.basename(
        sourceFile,
        ".java"
      );

      return {
        sourceFile,
        compile: {
          command: "javac",
          args: [sourceArg],
        },
        command: "java",
        args: ["-cp", workDir, className],
      };
    }

    case "typescript": {
      const compiledFile = path.join(
        workDir,
        `${path.basename(sourceFile, ".ts")}.js`
      );

      return {
        sourceFile,
        compile: {
          command: "tsc",
          args: [
            "--target",
            "ES2020",
            "--module",
            "commonjs",
            "--skipLibCheck",
            sourceArg,
          ],
        },
        command: "node",
        args: [path.basename(compiledFile)],
      };
    }

    case "go":
      return {
        sourceFile,
        compile: null,
        command: "go",
        args: ["run", sourceArg],
      };

    case "rust":
      return {
        sourceFile,
        compile: {
          command: "rustc",
          args: [sourceArg, "-o", executable],
        },
        command: executable,
        args: [],
      };

    case "php":
      return {
        sourceFile,
        compile: null,
        command: "php",
        args: [sourceArg],
      };

    case "ruby":
      return {
        sourceFile,
        compile: null,
        command: "ruby",
        args: [sourceArg],
      };

    case "bash":
      return {
        sourceFile,
        compile: null,
        command: "bash",
        args: [sourceArg],
      };

    case "csharp":
      if (process.platform !== "win32") {
        throw makeRunnerError(
          "The current C# runner requires Windows and the csc compiler on PATH.",
          503
        );
      }

      return {
        sourceFile,
        compile: {
          command: "csc",
          args: [
            `/out:${executable}`,
            sourceArg,
          ],
        },
        command: executable,
        args: [],
      };

    default:
      throw makeRunnerError(
        `Unsupported programming language: ${language}.`,
        415
      );
  }
};

const createFailureResult = ({
  status,
  message,
  compileOutput = "",
  exitCode = null,
  durationMs = 0,
  language,
  filePath,
}) => ({
  stdout: "",
  stderr: "",
  compileOutput,
  message,
  status,
  statusId: null,
  exitCode,
  executionTimeMs: durationMs,
  memoryUsedKb: null,
  success: false,
  language,
  filePath,
});

/**
 * Executes a standalone program using locally installed tools.
 */
export const runLocalProgram = async ({
  sourceCode,
  stdin = "",
  filePath = "program.js",
  language,
}) => {
  const normalizedLanguage = normalizeLanguage(language);

  const validated = validateExecutionRequest({
    language: normalizedLanguage,
    sourceCode,
    stdin,
    filePath,
  });

  sourceCode = validated.sourceCode;
  stdin = validated.stdin;
  filePath = validated.filePath;

  let workDir;

  try {
    workDir = await mkdtemp(
      path.join(os.tmpdir(), "reporunner-")
    );

    const plan = getExecutionPlan({
      language: normalizedLanguage,
      sourcePath: filePath,
      sourceCode,
      workDir,
    });

    await writeFile(
      plan.sourceFile,
      sourceCode,
      "utf8"
    );

    let compileOutput = "";
    let compileDurationMs = 0;

    // Compile languages that require compilation.
    if (plan.compile) {
      const compilation = await runProcess(
        plan.compile.command,
        plan.compile.args,
        {
          cwd: workDir,
          stdin: "",
        }
      );

      compileDurationMs = compilation.durationMs;

      compileOutput = [
        compilation.stdout,
        compilation.stderr,
      ]
        .filter(Boolean)
        .join("\n");

      if (
        compilation.timedOut ||
        compilation.outputLimitReached ||
        compilation.exitCode !== 0
      ) {
        const status = compilation.timedOut
          ? "Time Limit Exceeded"
          : compilation.outputLimitReached
            ? "Output Limit Exceeded"
            : "Compilation Error";

        const message = compilation.timedOut
          ? "Compilation timed out."
          : compilation.outputLimitReached
            ? "Compilation output exceeded the allowed limit."
            : "Compilation failed. Check the compiler output.";

        return createFailureResult({
          status,
          message,
          compileOutput,
          exitCode: compilation.exitCode,
          durationMs: compileDurationMs,
          language: normalizedLanguage,
          filePath,
        });
      }
    }

    // Run the program only after successful compilation.
    const execution = await runProcess(
      plan.command,
      plan.args,
      {
        cwd: workDir,
        stdin,
      }
    );

    let status = "Accepted";

    if (execution.timedOut) {
      status = "Time Limit Exceeded";
    } else if (execution.outputLimitReached) {
      status = "Output Limit Exceeded";
    } else if (execution.exitCode !== 0) {
      status = "Runtime Error";
    }

    const message = execution.timedOut
      ? `Execution exceeded the ${EXECUTION_TIMEOUT_MS} ms time limit.`
      : execution.outputLimitReached
        ? `Output exceeded the ${MAX_OUTPUT_BYTES} byte limit.`
        : "";

    return {
      stdout: execution.stdout,
      stderr: execution.stderr,
      compileOutput,
      message,
      status,
      statusId: null,
      exitCode: execution.exitCode,
      executionTimeMs:
        compileDurationMs + execution.durationMs,
      memoryUsedKb: null,
      success:
        !execution.timedOut &&
        !execution.outputLimitReached &&
        execution.exitCode === 0,
      language: normalizedLanguage,
      filePath,
    };
  } catch (error) {
    if (error instanceof RunnerError) {
      throw error;
    }

    throw makeRunnerError(
      error.message ||
        "The local execution runner encountered an error.",
      error.statusCode || 500
    );
  } finally {
    if (workDir) {
      await rm(workDir, {
        recursive: true,
        force: true,
      }).catch(() => {});
    }
  }
};
