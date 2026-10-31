
const GITHUB_API = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 15000;
const MAX_TREE_REQUESTS = 5000;
const FILE_COMMIT_CONCURRENCY = 3;
const MAX_COMMIT_CACHE_ENTRIES = 5000;

// Prevent large generated/dependency folders from overwhelming the app.
const IGNORED_DIRECTORIES = new Set([
    "node_modules",
    "vendor",
    "dist",
    "build",
    ".git",
    "coverage",
]);

// Cache successful file commit lookups across repository analyses.
const fileCommitCache = new Map();

const EMPTY_COMMIT_METADATA = {
    lastUpdatedAt: null,
    lastCommitSha: null,
    lastCommitMessage: null,
    lastCommitUrl: null,
};

/**
 * Shared GitHub request headers.
 *
 * GITHUB_TOKEN must be configured in the backend .env file.
 */
const getGitHubHeaders = () => {
    const headers = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    };

    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    return headers;
};

/**
 * Make an authenticated or unauthenticated GitHub API request.
 *
 * Includes rate-limit information in errors for debugging.
 */
const githubFetchResponse = async (url) => {
    const response = await fetch(url, {
        headers: getGitHubHeaders(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
        const remaining = response.headers.get(
            "x-ratelimit-remaining"
        );

        const reset = response.headers.get(
            "x-ratelimit-reset"
        );

        let githubMessage = "";

        try {
            const errorBody = await response.json();
            githubMessage = errorBody.message || "";
        } catch {
            // The error response may not contain JSON.
        }

        const isRateLimit =
            response.status === 429 ||
            (
                response.status === 403 &&
                (
                    remaining === "0" ||
                    /rate limit|secondary rate limit|abuse detection/i.test(
                        githubMessage
                    )
                )
            );

        const error = new Error(
            response.status === 404
                ? "GitHub repository or requested resource not found or not publicly accessible."
                : isRateLimit
                    ? `GitHub API rate limit reached. Remaining: ${
                        remaining ?? "unknown"
                    }. Reset: ${
                        reset
                            ? new Date(Number(reset) * 1000).toISOString()
                            : "unknown"
                    }.`
                    : response.status === 403
                        ? `GitHub API access denied: ${
                            githubMessage || "insufficient permissions"
                        }`
                        : `GitHub API request failed: ${response.status}${
                            githubMessage ? ` - ${githubMessage}` : ""
                        }`
        );

        error.status = response.status;
        error.isRateLimit = isRateLimit;
        error.rateLimitRemaining = remaining;
        error.rateLimitReset = reset;

        throw error;
    }

    return response;
};

/**
 * Fetch JSON from GitHub.
 */
const githubFetch = async (url) => {
    const response = await githubFetchResponse(url);
    return response.json();
};

/**
 * Fetch the total number of commits on a branch.
 *
 * Uses the Link header when GitHub provides it.
 */
const fetchTotalCommits = async (owner, repo, branch) => {
    const url = new URL(
        `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`
    );

    url.searchParams.set("sha", branch);
    url.searchParams.set("per_page", "1");

    const response = await githubFetchResponse(url.toString());

    const linkHeader = response.headers.get("Link");

    const lastPageMatch = linkHeader?.match(
        /<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/
    );

    if (lastPageMatch) {
        return Number(lastPageMatch[1]);
    }

    const commits = await response.json();

    return Array.isArray(commits) ? commits.length : 0;
};

/**
 * Parse a public GitHub repository URL.
 */
export const parseGitHubUrl = (repositoryUrl) => {
    let parsedUrl;

    try {
        parsedUrl = new URL(repositoryUrl);
    } catch {
        throw new Error("Please enter a valid GitHub repository URL.");
    }

    if (
        parsedUrl.hostname.toLowerCase() !== "github.com" ||
        !["https:", "http:"].includes(parsedUrl.protocol) ||
        parsedUrl.username ||
        parsedUrl.password
    ) {
        throw new Error("Only GitHub repository URLs are supported.");
    }

    const segments = parsedUrl.pathname.split("/").filter(Boolean);

    if (
        segments.length !== 2 ||
        !/^[a-zA-Z0-9-]+$/.test(segments[0]) ||
        !/^[a-zA-Z0-9_.-]+$/.test(segments[1])
    ) {
        throw new Error(
            "Enter a URL like https://github.com/owner/repository"
        );
    }

    const [owner, repositoryName] = segments;
    const repo = repositoryName.replace(/\.git$/i, "");

    if (!repo) {
        throw new Error("Please enter a valid GitHub repository name.");
    }

    return { owner, repo };
};

/**
 * Identify languages from extensions and special filenames.
 */
export const getLanguage = (filePath) => {
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

    // Do not treat a dotfile such as ".gitignore" as an extension.
    const extensionMatch = fileName.match(/\.([^.]+)$/);

    if (!extensionMatch) {
        return "Unknown";
    }

    const extension = extensionMatch[1].toLowerCase();

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
        scala: "Scala",
        groovy: "Groovy",

        go: "Go",
        rs: "Rust",
        rb: "Ruby",
        php: "PHP",
        swift: "Swift",
        dart: "Dart",
        lua: "Lua",
        pl: "Perl",
        r: "R",
        cs: "C#",
        fs: "F#",
        vb: "Visual Basic",

        html: "HTML",
        htm: "HTML",
        css: "CSS",
        scss: "SCSS",
        sass: "Sass",
        less: "Less",
        vue: "Vue",
        svelte: "Svelte",

        json: "JSON",
        jsonc: "JSON with Comments",
        xml: "XML",
        yaml: "YAML",
        yml: "YAML",
        toml: "TOML",
        md: "Markdown",
        mdx: "MDX",

        sh: "Shell",
        bash: "Shell",
        zsh: "Shell",
        bat: "Batch",
        ps1: "PowerShell",
        sql: "SQL",
        graphql: "GraphQL",
        gql: "GraphQL",
        proto: "Protocol Buffers",
        sol: "Solidity",
        ex: "Elixir",
        exs: "Elixir",
        hs: "Haskell",
        plsql: "PL/SQL",
    };

    return languages[extension] || "Unknown";
};

/**
 * Determine whether a path belongs to an ignored directory.
 */
const isIgnoredPath = (filePath) => {
    return filePath.split("/").some((part) =>
        IGNORED_DIRECTORIES.has(part.toLowerCase())
    );
};

/**
 * Convert GitHub tree entries into a consistent file format.
 *
 * Every discovered file is retained even if commit metadata
 * cannot be retrieved.
 */
const normalizeFiles = (treeEntries) => {
    return treeEntries
        .filter((item) => item.type === "blob")
        .filter((item) => !isIgnoredPath(item.path))
        .map((item) => ({
            path: item.path,
            size: item.size ?? 0,
            sha: item.sha,
            language: getLanguage(item.path),

            lastUpdatedAt: null,
            lastCommitSha: null,
            lastCommitMessage: null,
            lastCommitUrl: null,
        }))
        .sort((a, b) => a.path.localeCompare(b.path));
};

/**
 * Keep the cache bounded to avoid unlimited memory growth.
 *
 * The oldest entry is removed when the cache reaches its limit.
 */
const setCommitCache = (key, value) => {
    if (fileCommitCache.has(key)) {
        fileCommitCache.delete(key);
    }

    while (
        fileCommitCache.size >= MAX_COMMIT_CACHE_ENTRIES
    ) {
        const oldestKey = fileCommitCache.keys().next().value;

        if (oldestKey === undefined) {
            break;
        }

        fileCommitCache.delete(oldestKey);
    }

    fileCommitCache.set(key, value);
};

/**
 * Fetch the latest commit affecting a file at the analyzed commit.
 *
 * The cache key includes the pinned commit SHA, so metadata from
 * different repository snapshots is not mixed.
 */
const fetchLatestFileCommit = async (
    owner,
    repo,
    commitSha,
    filePath
) => {
    const cacheKey = JSON.stringify([
        owner.toLowerCase(),
        repo.toLowerCase(),
        commitSha,
        filePath,
    ]);

    if (fileCommitCache.has(cacheKey)) {
        return fileCommitCache.get(cacheKey);
    }

    const url = new URL(
        `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`
    );

    url.searchParams.set("path", filePath);
    url.searchParams.set("sha", commitSha);
    url.searchParams.set("per_page", "1");

    const commits = await githubFetch(url.toString());

    if (!Array.isArray(commits) || commits.length === 0) {
        // Avoid caching empty results; a later analysis can retry.
        return null;
    }

    const latestCommit = commits[0];
    const commitData = latestCommit.commit;

    const commitInfo = {
        lastUpdatedAt:
            commitData?.author?.date ??
            commitData?.committer?.date ??
            null,

        lastCommitSha: latestCommit.sha ?? null,

        lastCommitMessage: commitData?.message ?? null,

        lastCommitUrl: latestCommit.html_url ?? null,
    };

    setCommitCache(cacheKey, commitInfo);

    return commitInfo;
};

/**
 * Enrich discovered files with their latest commit information.
 *
 * - Uses bounded concurrency.
 * - Preserves successful results if another request fails.
 * - Stops starting new requests after a confirmed rate limit.
 * - Never removes a discovered file due to a metadata failure.
 */
const enrichFilesWithLastUpdated = async ({
    owner,
    repo,
    commitSha,
    files,
}) => {
    const enrichedFiles = new Array(files.length);

    let nextIndex = 0;
    let rateLimited = false;

    const worker = async () => {
        while (true) {
            const index = nextIndex++;

            if (index >= files.length) {
                return;
            }

            const file = files[index];

            // Stop starting new API requests after rate limiting.
            // Files remain in the response with empty metadata.
            if (rateLimited) {
                enrichedFiles[index] = {
                    ...file,
                    ...EMPTY_COMMIT_METADATA,
                };

                continue;
            }

            try {
                const commitInfo = await fetchLatestFileCommit(
                    owner,
                    repo,
                    commitSha,
                    file.path
                );

                enrichedFiles[index] = {
                    ...file,
                    ...EMPTY_COMMIT_METADATA,
                    ...(commitInfo ?? {}),
                };
            } catch (error) {
                console.warn(
                    "[RepoRunner] File commit lookup failed:",
                    {
                        file: file.path,
                        status: error.status ?? null,
                        message: error.message,
                        rateLimitRemaining:
                            error.rateLimitRemaining ?? null,
                        rateLimitReset:
                            error.rateLimitReset ?? null,
                    }
                );

                if (error.isRateLimit) {
                    rateLimited = true;

                    console.warn(
                        "[RepoRunner] GitHub rate limit reached. " +
                        "Remaining files will still be returned, " +
                        "but some commit metadata may be unavailable."
                    );
                }

                enrichedFiles[index] = {
                    ...file,
                    ...EMPTY_COMMIT_METADATA,
                };
            }
        }
    };

    await Promise.all(
        Array.from(
            {
                length: Math.min(
                    FILE_COMMIT_CONCURRENCY,
                    files.length
                ),
            },
            () => worker()
        )
    );

    const filesWithCommitMessages = enrichedFiles.filter(
        (file) => Boolean(file?.lastCommitMessage)
    ).length;

    console.info("[RepoRunner] File metadata summary:", {
        totalFiles: enrichedFiles.length,
        filesWithCommitMessages,
        filesWithoutCommitMessages:
            enrichedFiles.length - filesWithCommitMessages,
        rateLimited,
        authenticated: Boolean(process.env.GITHUB_TOKEN),
    });

    return enrichedFiles;
};

/**
 * Retrieve the complete repository tree.
 *
 * GitHub may truncate recursive tree responses. If that happens,
 * traverse directories using non-recursive tree requests.
 */
const getCompleteRepositoryTree = async (
    owner,
    repo,
    rootTreeSha
) => {
    const recursiveTree = await githubFetch(
        `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(rootTreeSha)}?recursive=1`
    );

    if (!recursiveTree.truncated) {
        return {
            entries: recursiveTree.tree || [],
            truncated: false,
        };
    }

    const entries = [];
    const pendingTreeShas = [rootTreeSha];
    const visitedTreeShas = new Set();

    let requestCount = 0;
    let incomplete = false;

    while (pendingTreeShas.length > 0) {
        const treeSha = pendingTreeShas.pop();

        if (visitedTreeShas.has(treeSha)) {
            continue;
        }

        visitedTreeShas.add(treeSha);

        requestCount += 1;

        if (requestCount > MAX_TREE_REQUESTS) {
            incomplete = true;
            break;
        }

        const directoryTree = await githubFetch(
            `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(treeSha)}`
        );

        if (directoryTree.truncated) {
            incomplete = true;
        }

        for (const item of directoryTree.tree || []) {
            if (item.type === "tree") {
                if (!isIgnoredPath(item.path)) {
                    pendingTreeShas.push(item.sha);
                }

                continue;
            }

            if (
                item.type === "blob" &&
                !isIgnoredPath(item.path)
            ) {
                entries.push(item);
            }
        }
    }

    return {
        entries,
        truncated: incomplete,
    };
};

/**
 * Analyze a public GitHub repository.
 *
 * Pins file discovery and file commit lookups to a consistent
 * repository snapshot and preserves the existing response shape.
 */
export const analyzeRepository = async (repositoryUrl) => {
    const { owner, repo } = parseGitHubUrl(repositoryUrl);

    const repository = await githubFetch(
        `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
    );

    if (repository.private) {
        throw new Error(
            "Private repositories are not supported yet."
        );
    }

    if (repository.archived) {
        throw new Error("This repository is archived.");
    }

    const branch = repository.default_branch;

    if (!branch) {
        throw new Error(
            "Could not determine the repository's default branch."
        );
    }

    // Preserve the existing total commit count behavior.
    const totalCommits = await fetchTotalCommits(
        owner,
        repo,
        branch
    );

    // Pin analysis to the latest commit on the default branch.
    const commit = await githubFetch(
        `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(branch)}`
    );

    const commitSha = commit.sha;
    const rootTreeSha = commit.commit?.tree?.sha;

    if (!commitSha || !rootTreeSha) {
        throw new Error(
            "Could not determine the repository commit or tree."
        );
    }

    const result = await getCompleteRepositoryTree(
        owner,
        repo,
        rootTreeSha
    );

    const discoveredFiles = normalizeFiles(result.entries);

    // Metadata failures do not remove files from the result.
    const files = await enrichFilesWithLastUpdated({
        owner,
        repo,
        commitSha,
        files: discoveredFiles,
    });

    return {
        repository: {
            name: repository.full_name,
            description: repository.description,
            url: repository.html_url,
            defaultBranch: branch,
            stars: repository.stargazers_count,
            commitSha,
            totalCommits,
        },

        files,

        // Preserve compatibility with existing frontend code.
        programs: files,

        totalFiles: files.length,
        truncated: result.truncated,
        analyzedCommit: commitSha,
    };
};
