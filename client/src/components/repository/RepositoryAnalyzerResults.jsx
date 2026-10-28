
import {
    ArrowUpRight,
    CheckCircle2,
    Clock3,
    FileCode2,
    FolderGit2,
    GitBranch,
    Hash,
    Layers3,
    Terminal,
} from "lucide-react";

function formatCommit(commitSha) {
    return typeof commitSha === "string" && commitSha.length > 10
        ? `${commitSha.slice(0, 7)}...`
        : commitSha || "Not available";
}

function StatCard({
    icon: Icon,
    label,
    children,
    accent = "violet",
}) {
    const accents = {
        violet: {
            icon: "border-violet-400/15 bg-violet-400/[0.08] text-violet-300",
            hover: "hover:border-violet-400/25",
        },
        emerald: {
            icon: "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300",
            hover: "hover:border-emerald-400/25",
        },
        purple: {
            icon: "border-purple-400/15 bg-purple-400/[0.07] text-purple-300",
            hover: "hover:border-purple-400/25",
        },
    };

    const style = accents[accent] || accents.violet;

    return (
        <div
            className={`group min-w-0 rounded-2xl border border-white/[0.08] bg-[#111118] p-5 transition duration-200 ${style.hover} sm:p-6`}
        >
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zinc-400">
                    {label}
                </p>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.icon}`}
                >
                    <Icon size={19} aria-hidden="true" />
                </div>
            </div>

            <div className="mt-5 min-w-0">{children}</div>
        </div>
    );
}

function SectionHeading({
    icon: Icon,
    title,
    description,
    count,
}) {
    return (
        <div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.07] text-violet-300">
                    <Icon size={19} aria-hidden="true" />
                </div>

                <div className="min-w-0">
                    <h3 className="font-semibold text-white">
                        {title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-zinc-500 sm:text-sm">
                        {description}
                    </p>
                </div>
            </div>

            <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs font-medium text-zinc-400">
                <FileCode2 size={14} aria-hidden="true" />
                {count}
            </span>
        </div>
    );
}

function getLanguageStyle(language) {
    const normalized = String(language || "").toLowerCase();

    if (
        normalized.includes("c++") ||
        normalized === "cpp"
    ) {
        return "border-sky-400/15 bg-sky-400/[0.07] text-sky-300";
    }

    if (
        normalized === "c" ||
        normalized.includes("c language")
    ) {
        return "border-blue-400/15 bg-blue-400/[0.07] text-blue-300";
    }

    if (
        normalized.includes("python") ||
        normalized === "py"
    ) {
        return "border-amber-400/15 bg-amber-400/[0.07] text-amber-300";
    }

    if (normalized.includes("java")) {
        return "border-orange-400/15 bg-orange-400/[0.07] text-orange-300";
    }

    if (
        normalized.includes("javascript") ||
        normalized === "js" ||
        normalized.includes("typescript") ||
        normalized === "ts"
    ) {
        return "border-yellow-400/15 bg-yellow-400/[0.07] text-yellow-300";
    }

    return "border-violet-400/15 bg-violet-400/[0.07] text-violet-300";
}

function formatFileSize(size) {
    if (typeof size !== "number" || !Number.isFinite(size) || size < 0) {
        return null;
    }

    if (size < 1024) {
        return `${size.toLocaleString()} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function SourceFileRow({ program, index }) {
    const fileName =
        program.path || program.name || "Source file";

    const language =
        program.language || "Source file";

    const fileSize = formatFileSize(program.size);

    return (
        <li className="group flex min-w-0 items-center gap-3 px-4 py-4 transition-colors hover:bg-white/[0.025] sm:gap-4 sm:px-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-[#181720] text-violet-300 transition-colors group-hover:border-violet-400/20 group-hover:bg-violet-400/[0.07]">
                <FileCode2 size={19} aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
                <p
                    title={fileName}
                    className="break-all text-sm font-medium leading-6 text-zinc-200"
                >
                    {fileName}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                        className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-medium sm:text-[11px] ${getLanguageStyle(language)}`}
                    >
                        {language}
                    </span>

                    {fileSize && (
                        <span className="text-[11px] text-zinc-500">
                            {fileSize}
                        </span>
                    )}

                    {program.path && program.name && (
                        <span className="text-[11px] text-zinc-600">
                            File {index + 1}
                        </span>
                    )}
                </div>
            </div>

            <ArrowUpRight
                size={17}
                aria-hidden="true"
                className="shrink-0 text-zinc-600 transition-colors group-hover:text-violet-300"
            />
        </li>
    );
}

export default function RepositoryAnalyzerResults({ result }) {
    const repository = result?.repository;

    const repositoryName =
        typeof repository === "object" && repository !== null
            ? repository.name
            : repository;

    const programs = Array.isArray(result?.programs)
        ? result.programs
        : [];

    return (
        <section
            aria-live="polite"
            className="mt-10 space-y-6 sm:mt-12"
        >
            {/* Results heading */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300">
                            <CheckCircle2
                                size={18}
                                aria-hidden="true"
                            />
                        </div>

                        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                            Repository overview
                        </h2>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Your repository has been analyzed. Review the
                        discovered source files below.
                    </p>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-3.5 py-2 text-xs font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Analysis complete
                </span>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    icon={GitBranch}
                    label="Repository"
                    accent="violet"
                >
                    <p className="break-words text-lg font-semibold text-zinc-100">
                        {repositoryName || "Analyzed repository"}
                    </p>

                    <p className="mt-1.5 text-xs text-zinc-500">
                        GitHub project
                    </p>
                </StatCard>

                <StatCard
                    icon={FileCode2}
                    label="Discovered programs"
                    accent="emerald"
                >
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-semibold tracking-tight text-white">
                            {programs.length}
                        </p>

                        <span className="mb-1 text-xs text-zinc-500">
                            {programs.length === 1
                                ? "file found"
                                : "files found"}
                        </span>
                    </div>

                    <p className="mt-1.5 text-xs text-zinc-500">
                        Available source files
                    </p>
                </StatCard>

                <StatCard
                    icon={Layers3}
                    label="Default branch"
                    accent="purple"
                >
                    <p className="break-words text-lg font-semibold text-zinc-100">
                        {result?.defaultBranch || "Not provided"}
                    </p>

                    <p className="mt-1.5 text-xs text-zinc-500">
                        Repository branch
                    </p>
                </StatCard>
            </div>

            {/* Source files */}
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111118] sm:rounded-3xl">
                <SectionHeading
                    icon={FolderGit2}
                    title="Discovered source files"
                    description={
                        programs.length > 0
                            ? "Browse the program files found in this repository."
                            : "No supported source files were returned."
                    }
                    count={`${programs.length} ${
                        programs.length === 1 ? "file" : "files"
                    }`}
                />

                {programs.length > 0 ? (
                    <ul className="divide-y divide-white/[0.06]">
                        {programs.map((program, index) => (
                            <SourceFileRow
                                key={
                                    program.path ||
                                    `${program.name || "source"}-${index}`
                                }
                                program={program}
                                index={index}
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="px-5 py-12 text-center sm:py-16">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] text-zinc-500">
                            <Terminal
                                size={25}
                                aria-hidden="true"
                            />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-zinc-300">
                            No programs found
                        </p>

                        <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-zinc-500 sm:text-sm">
                            Check that the repository contains supported
                            source files, then try analyzing it again.
                        </p>
                    </div>
                )}

                {/* Pinned commit */}
                {result?.commitSha && (
                    <div className="flex min-w-0 flex-col gap-2 border-t border-white/[0.07] bg-white/[0.015] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Hash
                                size={14}
                                className="shrink-0"
                                aria-hidden="true"
                            />
                            <span>Analyzed commit</span>
                        </div>

                        <code
                            title={result.commitSha}
                            className="max-w-full break-all rounded-lg border border-white/[0.07] bg-[#09090f] px-3 py-2 font-mono text-xs text-violet-200"
                        >
                            {formatCommit(result.commitSha)}
                        </code>
                    </div>
                )}
            </div>

            {/* Session note */}
            <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
                <Clock3
                    size={16}
                    className="mt-0.5 shrink-0 text-zinc-500"
                    aria-hidden="true"
                />

                <p className="text-xs leading-5 text-zinc-500">
                    Sessions expire. If your workspace session expires,
                    analyze the repository again to start a new session.
                </p>
            </div>
        </section>
    );
}
