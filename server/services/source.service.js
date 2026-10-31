
const GITHUB_API = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 15000;
const MAX_SOURCE_SIZE = 500_000;

const githubFetch = async (url) => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const error = new Error(
      response.status === 404
        ? "GitHub resource not found or not publicly accessible."
        : response.status === 403 || response.status === 429
          ? "GitHub API rate limit reached or access denied."
          : `GitHub API request failed with status ${response.status}.`
    );

    error.status = response.status;
    throw error;
  }

  return response.json();
};

const validateRepositoryCoordinates = (
  owner,
  repo,
  commitSha
) => {
  if (
    typeof owner !== "string" ||
    !/^[a-zA-Z0-9-]+$/.test(owner)
  ) {
    throw new Error("Invalid repository owner.");
  }

  if (
    typeof repo !== "string" ||
    !/^[a-zA-Z0-9_.-]+$/.test(repo) ||
    repo === "." ||
    repo === ".."
  ) {
    throw new Error("Invalid repository name.");
  }

  // Git commit SHA-1 format.
  if (
    typeof commitSha !== "string" ||
    !/^[a-f0-9]{40}$/i.test(commitSha)
  ) {
    throw new Error("A valid commit SHA is required.");
  }
};

/**
 * Infer language from filename first.
 * Content-based detection is used when the extension is absent
 * or cannot identify a supported language.
 */
export const getLanguage = (filePath, sourceCode = "") => {
  const fileName = filePath.split("/").pop() || "";
  const normalizedName = fileName.toLowerCase();

  const specialNames = {
    dockerfile: "Dockerfile",
    makefile: "Makefile",
    gnumakefile: "Makefile",
    jenkinsfile: "Jenkinsfile",
    ".gitignore": "Git Ignore",
    ".dockerignore": "Docker Ignore",
    ".editorconfig": "EditorConfig",
    ".env": "Environment Configuration",
    ".npmrc": "NPM Configuration",
    ".nvmrc": "Node Version Configuration",
  };

  if (specialNames[normalizedName]) {
    return specialNames[normalizedName];
  }

  const extensionMatch = fileName.match(/\.([^.]+)$/);
  const extension = extensionMatch?.[1]?.toLowerCase();

  const languages = {
    js: "JavaScript",
    mjs: "JavaScript",
    cjs: "JavaScript",
    jsx: "JavaScript (React)",
    ts: "TypeScript",
    mts: "TypeScript",
    cts: "TypeScript",
    tsx: "TypeScript (React)",

    py: "Python",
    pyw: "Python",

    c: "C",
    h: "C/C++ Header",
    cc: "C++",
    cpp: "C++",
    cxx: "C++",
    hh: "C++ Header",
    hpp: "C++ Header",
    hxx: "C++ Header",

    java: "Java",
    kt: "Kotlin",
    kts: "Kotlin",
    go: "Go",
    rs: "Rust",
    rb: "Ruby",
    php: "PHP",
    cs: "C#",
    swift: "Swift",
    dart: "Dart",
    lua: "Lua",
    sql: "SQL",

    html: "HTML",
    htm: "HTML",
    css: "CSS",
    scss: "SCSS",
    json: "JSON",
    xml: "XML",
    yaml: "YAML",
    yml: "YAML",
    toml: "TOML",
    md: "Markdown",
    mdx: "MDX",
    sh: "Shell",
    bash: "Shell",
    ps1: "PowerShell",
    bat: "Batch",
  };

  if (extension && languages[extension]) {
    return languages[extension];
  }

  return detectLanguageFromContent(sourceCode);
};

/**
 * Lightweight heuristic detection.
 *
 * This is not a compiler or a guaranteed language classifier.
 * Ambiguous snippets should remain Unknown.
 */
const detectLanguageFromContent = (sourceCode) => {
  if (typeof sourceCode !== "string" || !sourceCode.trim()) {
    return "Unknown";
  }

  const code = sourceCode
    .replace(/^\uFEFF/, "")
    .replace(/^\s*#!.*$/gm, "")
    .trim();

  if (/^<!doctype\s+html\b|^<html[\s>]/i.test(code)) {
    return "HTML";
  }

  if (/^\s*[{[]/.test(code)) {
    try {
      JSON.parse(code);
      return "JSON";
    } catch {
      // Continue checking other languages.
    }
  }

  // Java has distinctive class and main method patterns.
  if (
    /\bpublic\s+class\s+[A-Za-z_$][\w$]*/.test(code) &&
    /\bstatic\s+void\s+main\s*\(\s*String\s*\[\s*\]\s+\w+\s*\)/.test(code)
  ) {
    return "Java";
  }

  // C++-specific constructs.
  if (
    /^\s*#include\s*<bits\/stdc\+\+\.h>/m.test(code) ||
    /\bstd::(cout|cin|string|vector|map)\b/.test(code) ||
    /\busing\s+namespace\s+std\s*;/.test(code) ||
    /\btemplate\s*<\s*(?:typename|class)\b/.test(code)
  ) {
    return "C++";
  }

  // Common C constructs.
  if (
    /^\s*#include\s*<(?:stdio|stdlib|string|math|stdbool|stdint)\.h>/m.test(code) ||
    /\bprintf\s*\(/.test(code) ||
    /\bscanf\s*\(/.test(code)
  ) {
    return "C";
  }

  // Python syntax.
  if (
    /^\s*(?:def\s+\w+\s*\(|class\s+\w+\s*[:(])/m.test(code) ||
    /^\s*if\s+__name__\s*==\s*["']__main__["']\s*:/m.test(code) ||
    /^\s*print\s*\(.+\)\s*$/m.test(code)
  ) {
    return "Python";
  }

  // JavaScript / TypeScript clues.
  if (
    /\b(?:const|let|var)\s+\w+\s*=/.test(code) ||
    /\bconsole\.log\s*\(/.test(code) ||
    /\bexport\s+default\b/.test(code) ||
    /\b(?:function|async\s+function)\s+\w*\s*\(/.test(code)
  ) {
    if (
      /\binterface\s+\w+/.test(code) ||
      /\btype\s+\w+\s*=/.test(code) ||
      /:\s*(?:string|number|boolean)\b/.test(code)
    ) {
      return "TypeScript";
    }

    return "JavaScript";
  }

  // Go.
  if (
    /^\s*package\s+\w+/m.test(code) &&
    /^\s*func\s+(?:main|\w+)\s*\(/m.test(code)
  ) {
    return "Go";
  }

  // Rust.
  if (
    /^\s*fn\s+main\s*\(/m.test(code) ||
    /^\s*use\s+std::/.test(code)
  ) {
    return "Rust";
  }

  // Shell script.
  if (
    /^#!.*\b(?:bash|sh|zsh)\b/.test(code) ||
    /^\s*(?:echo|read)\s+.+$/m.test(code)
  ) {
    return "Shell";
  }

  return "Unknown";
};

/**
 * Validate and normalize a repository-relative path.
 */
const validateFilePath = (filePath) => {
  if (
    typeof filePath !== "string" ||
    filePath.length === 0 ||
    filePath.length > 1000 ||
    filePath.startsWith("/") ||
    filePath.includes("\\") ||
    filePath.includes("\0") ||
    filePath.split("/").some(
      (part) => part === "." || part === ".." || part === ""
    )
  ) {
    throw new Error("Invalid source file path.");
  }

  return filePath;
};

/**
 * Fetch one selected file from the repository at the requested commit.
 *
 * Extensionless source files are allowed.
 */
export const getSourceFile = async ({
  owner,
  repo,
  commitSha,
  filePath,
}) => {
  validateRepositoryCoordinates(owner, repo, commitSha);
  validateFilePath(filePath);

  const encodedPath = filePath
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  const url =
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/` +
    `${encodeURIComponent(repo)}/contents/${encodedPath}` +
    `?ref=${encodeURIComponent(commitSha)}`;

  const file = await githubFetch(url);

  if (Array.isArray(file) || file.type !== "file") {
    throw new Error("The selected path is not a file.");
  }

  if (typeof file.size !== "number" || file.size > MAX_SOURCE_SIZE) {
    throw new Error(
      "Source file is too large. The maximum supported size is 500 KB."
    );
  }

  if (file.encoding !== "base64" || typeof file.content !== "string") {
    throw new Error(
      "GitHub did not return file content in the expected format."
    );
  }

  const sourceCode = Buffer.from(
    file.content.replace(/\s/g, ""),
    "base64"
  ).toString("utf8");

  // Check the decoded size too.
  const actualSize = Buffer.byteLength(sourceCode, "utf8");

  if (actualSize > MAX_SOURCE_SIZE) {
    throw new Error(
      "Source file is too large. The maximum supported size is 500 KB."
    );
  }

  const language = getLanguage(file.path, sourceCode);

  return {
    path: file.path,
    name: file.name,
    language,
    size: actualSize,
    sourceCode,
    commitSha,
  };
};
