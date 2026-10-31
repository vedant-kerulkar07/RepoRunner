
const EXTENSION_LANGUAGES = {
  // C
  ".c": "c",
  ".h": "c",

  // C++
  ".cc": "cpp",
  ".cpp": "cpp",
  ".cxx": "cpp",
  ".c++": "cpp",
  ".hpp": "cpp",
  ".hh": "cpp",
  ".hxx": "cpp",

  // Java
  ".java": "java",

  // JavaScript
  ".js": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".jsx": "javascript",

  // Python
  ".py": "python",
  ".pyw": "python",

  // TypeScript
  ".ts": "typescript",
  ".tsx": "typescript",
  ".mts": "typescript",
  ".cts": "typescript",

  // Other compiled/interpreted languages
  ".go": "go",
  ".php": "php",
  ".rb": "ruby",
  ".rs": "rust",
  ".cs": "csharp",
  ".sh": "bash",
};

const LANGUAGE_ALIASES = {
  js: "javascript",
  node: "javascript",
  "node.js": "javascript",
  ecmascript: "javascript",

  py: "python",
  python3: "python",

  "c++": "cpp",
  "c plus plus": "cpp",

  "c#": "csharp",
  "c sharp": "csharp",

  ts: "typescript",

  golang: "go",
  rustlang: "rust",
  shell: "bash",
  "shell script": "bash",
};

const SUPPORTED_LANGUAGES = new Set([
  ...Object.values(EXTENSION_LANGUAGES),
  "javascript",
  "python",
  "typescript",
  "c",
  "cpp",
  "java",
  "go",
  "rust",
  "php",
  "ruby",
  "csharp",
  "bash",
]);

const normalizeLanguageName = (language) => {
  const normalized = String(language || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  return LANGUAGE_ALIASES[normalized] || normalized;
};

export const detectLanguage = (
  filePath,
  declaredLanguage
) => {
  const normalizedPath = String(filePath || "")
    .trim()
    .replace(/\\/g, "/");

  const extension = normalizedPath
    .match(/\.[^./]+$/)?.[0]
    ?.toLowerCase();

  // A recognized file extension is the strongest signal.
  if (extension && EXTENSION_LANGUAGES[extension]) {
    return EXTENSION_LANGUAGES[extension];
  }

  const normalizedLanguage =
    normalizeLanguageName(declaredLanguage);

  // Never return an unsupported language as executable.
  if (SUPPORTED_LANGUAGES.has(normalizedLanguage)) {
    return normalizedLanguage;
  }

  return "unknown";
};

export const getSupportedLanguageExtensions = () =>
  Object.keys(EXTENSION_LANGUAGES);

export const getSupportedLanguages = () =>
  [...SUPPORTED_LANGUAGES];
