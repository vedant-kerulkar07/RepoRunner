import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    FileCode2,
    GitBranch,
    GitCommit,
    CircleAlert,
    LoaderCircle,
    CheckCircle2,
    Code2,
    RotateCcw,
    Sparkles,
    Brain,
    PanelLeft,
    FileCheck2,
    ChevronRight,
    Search,
    Clock3,
} from "lucide-react";

import { fetchSourceFile } from "../services/source.service";
import { executeProgram } from "../services/execution.service";
import ProgramInputPanel from "../components/workspace/ProgramInputPanel";
import WorkspaceAnalysisResults from "../components/workspace/WorkspaceAnalysisResults";

function getErrorMessage(error, fallback) {
    if (typeof error?.message === "string" && error.message.trim()) {
        return error.message;
    }

    return fallback;
}

function getRepositoryName(repository) {
    if (typeof repository === "string") {
        return repository;
    }

    if (repository && typeof repository === "object") {
        return (
            repository.fullName ||
            repository.full_name ||
            repository.name ||
            repository.html_url ||
            "Analyzed repository"
        );
    }

    return "Analyzed repository";
}

function getSourceCode(data) {
    if (typeof data?.sourceCode === "string") return data.sourceCode;
    if (typeof data?.content === "string") return data.content;
    if (typeof data?.code === "string") return data.code;
    return null;
}

function getSuggestedInputs(inputPlan, sourceAnalysis) {
    if (Array.isArray(inputPlan?.suggestedInputs)) {
        return inputPlan.suggestedInputs;
    }

    if (Array.isArray(sourceAnalysis?.sampleInputs)) {
        return sourceAnalysis.sampleInputs;
    }

    return [];
}

/**
 * Supports common timestamp fields returned by the backend.
 */
function getFileUpdatedAt(program) {
    return (
        program?.lastUpdatedAt ||
        program?.last_updated_at ||
        program?.updatedAt ||
        program?.updated_at ||
        null
    );
}

/**
 * Converts a GitHub commit timestamp into relative time.
 * Examples: 2 hours ago, yesterday, 3 days ago.
 */
function formatRelativeTime(dateValue) {
    if (!dateValue) return null;

    const timestamp = new Date(dateValue).getTime();

    if (!Number.isFinite(timestamp)) {
        return null;
    }

    const differenceInSeconds = Math.round(
        (timestamp - Date.now()) / 1000
    );

    const units = [
        { unit: "year", seconds: 31536000 },
        { unit: "month", seconds: 2592000 },
        { unit: "week", seconds: 604800 },
        { unit: "day", seconds: 86400 },
        { unit: "hour", seconds: 3600 },
        { unit: "minute", seconds: 60 },
        { unit: "second", seconds: 1 },
    ];

    const formatter = new Intl.RelativeTimeFormat("en", {
        numeric: "auto",
    });

    for (const { unit, seconds } of units) {
        if (Math.abs(differenceInSeconds) >= seconds || unit === "second") {
            return formatter.format(
                Math.round(differenceInSeconds / seconds),
                unit
            );
        }
    }

    return null;
}

/**
 * Formats the exact date shown when hovering over the timestamp.
 */
function formatExactDate(dateValue) {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export default function WorkspacePage() {
    const navigate = useNavigate();
    const outletContext = useOutletContext() || {};
    const { analysis } = outletContext;

    const [selectedPath, setSelectedPath] = useState("");
    const [source, setSource] = useState(null);
    const [loadingPath, setLoadingPath] = useState("");
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("");

    const [stdin, setStdin] = useState("");
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState(null);
    const [executionError, setExecutionError] = useState("");

    const sourceRequestId = useRef(0);
    const executionRequestId = useRef(0);
    const executionLock = useRef(false);

    const sessionId = analysis?.sessionId;
    const repository = getRepositoryName(analysis?.repository);

    const programs = Array.isArray(analysis?.programs)
        ? analysis.programs
        : [];

    const repositoryMetadata =
        analysis?.repository && typeof analysis.repository === "object"
            ? analysis.repository
            : {};

    const totalCommits =
        typeof repositoryMetadata.totalCommits === "number"
            ? repositoryMetadata.totalCommits
            : typeof analysis?.totalCommits === "number"
                ? analysis.totalCommits
                : null;

    const inputPlan = executionResult?.inputPlan;
    const sourceAnalysis = executionResult?.analysis;

    const requiresUserInput =
        executionResult?.requiresUserInput === true ||
        inputPlan?.requiresUserInput === true ||
        sourceAnalysis?.requiresUserInput === true;

    const inputPrompt =
        sourceAnalysis?.inputPrompt ??
        inputPlan?.inputPrompt ??
        executionResult?.inputPrompt ??
        "";

    const inputExplanation =
        sourceAnalysis?.inputExplanation ??
        inputPlan?.inputExplanation ??
        executionResult?.inputExplanation ??
        "";

    const inputFormat =
        sourceAnalysis?.inputFormat ??
        inputPlan?.inputFormat ??
        executionResult?.inputFormat ??
        "";

    const suggestedInputs = getSuggestedInputs(inputPlan, sourceAnalysis);

    const filteredPrograms = programs.filter((program) => {
        const name = program?.path || program?.name || "";
        return name.toLowerCase().includes(filter.trim().toLowerCase());
    });

    useEffect(() => {
        return () => {
            sourceRequestId.current += 1;
            executionRequestId.current += 1;
            executionLock.current = false;
        };
    }, []);

    async function handleSelectFile(program) {
        const filePath = program?.path || program?.name;

        if (!filePath || typeof filePath !== "string") {
            setError("This source file does not have a valid path.");
            return;
        }

        if (!sessionId) {
            setError("The repository session is unavailable. Analyze the repository again.");
            return;
        }

        if (filePath === selectedPath && source && !loadingPath) return;

        const requestId = ++sourceRequestId.current;

        executionRequestId.current += 1;
        executionLock.current = false;

        setSelectedPath(filePath);
        setSource(null);
        setError("");
        setExecutionError("");
        setExecutionResult(null);
        setStdin("");
        setIsExecuting(false);
        setLoadingPath(filePath);

        try {
            const data = await fetchSourceFile(sessionId, filePath);

            if (requestId !== sourceRequestId.current) return;

            const sourceCode = getSourceCode(data);

            if (sourceCode === null) {
                throw new Error("The source response did not contain a recognized source-code field.");
            }

            setSource({
                path: data?.path || filePath,
                language: data?.language || program?.language || "Source code",
                code: sourceCode,
            });
        } catch (err) {
            if (requestId !== sourceRequestId.current) return;

            setError(getErrorMessage(err, "Unable to load this source file."));
        } finally {
            if (requestId === sourceRequestId.current) {
                setLoadingPath("");
            }
        }
    }

    async function runAnalysis(inputProvided = false) {
        if (!selectedPath || !source) {
            setExecutionError("Select and load a source file before analyzing it.");
            return;
        }

        if (!sessionId) {
            setExecutionError("The repository session is unavailable. Analyze the repository again.");
            return;
        }

        if (executionLock.current) return;

        executionLock.current = true;
        const requestId = ++executionRequestId.current;

        setIsExecuting(true);
        setExecutionError("");
        setExecutionResult(null);

        try {
            const payload = {
                sessionId,
                filePath: selectedPath,
            };

            if (inputProvided) {
                payload.stdin = stdin;
            }

            const data = await executeProgram(payload);

            if (requestId !== executionRequestId.current) return;

            if (!data || typeof data !== "object") {
                throw new Error("The analysis service returned an invalid response.");
            }

            setExecutionResult(data);
        } catch (err) {
            if (requestId !== executionRequestId.current) return;

            setExecutionError(
                getErrorMessage(
                    err,
                    inputProvided
                        ? "Unable to predict the program output."
                        : "Unable to analyze the source or predict its output.",
                ),
            );
        } finally {
            if (requestId === executionRequestId.current) {
                executionLock.current = false;
                setIsExecuting(false);
            }
        }
    }

    async function handleAnalyze() {
        await runAnalysis(false);
    }

    async function handleSubmitInputAndPredict() {
        await runAnalysis(true);
    }

    function resetPrediction() {
        executionRequestId.current += 1;
        executionLock.current = false;
        setStdin("");
        setExecutionResult(null);
        setExecutionError("");
        setIsExecuting(false);
    }

    if (!analysis) {
        return (
            <main className="workspace-page flex min-h-screen items-center justify-center px-4 py-10 text-zinc-100">
                <div className="workspace-enter w-full max-w-md rounded-3xl border border-white/[0.09] bg-[#111119] p-8 text-center shadow-2xl shadow-black/30">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] text-amber-200">
                        <CircleAlert size={27} />
                    </div>

                    <h1 className="mt-5 text-xl font-semibold tracking-tight text-white">
                        No repository selected
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Analyze a GitHub repository first to open your workspace.
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="workspace-button-primary mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
                    >
                        Analyze repository <ChevronRight size={16} />
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="workspace-page min-h-screen overflow-x-clip text-zinc-100">
            <div className="workspace-enter mx-auto w-full max-w-[1600px] px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8">

                {/* Navigation */}
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-5">
                    <Link
                        to="/"
                        className="workspace-back inline-flex items-center gap-2 rounded-lg py-2 pr-2 text-sm text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                    >
                        <ArrowLeft size={16} />
                        <span>Repositories</span>
                    </Link>

                    <div className="flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3 py-2 text-xs font-medium text-violet-200">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-40" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
                        </span>
                        AI-powered workspace
                    </div>
                </header>

                {/* Page heading */}
                <section className="relative py-7 sm:py-9">
                    <div className="pointer-events-none absolute -left-10 top-0 h-48 w-48 rounded-full bg-violet-600/[0.08] blur-3xl" />

                    <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="workspace-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/[0.06] text-violet-200 shadow-lg shadow-violet-950/20 sm:h-14 sm:w-14">
                                <GitBranch size={25} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300">
                                    Repository workspace
                                </p>

                                <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-[34px]">
                                    {repository}
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-200">
                                    Explore source files, understand program logic, and
                                    discover expected output with AI-assisted analysis.
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-zinc-200">
                            <span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Repository loaded
                            </span>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="workspace-card group rounded-2xl border border-white/[0.08] bg-[#111119] p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/10 bg-violet-400/[0.08] text-violet-200">
                                    <FileCode2 size={19} />
                                </div>

                                <div>
                                    <p className="text-sm text-zinc-200">Discovered files</p>
                                    <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
                                        {programs.length.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <span className="rounded-lg bg-white/[0.035] px-2 py-1 text-[11px] text-zinc-200">
                                Source files
                            </span>
                        </div>
                    </div>

                    <div className="workspace-card group rounded-2xl border border-white/[0.08] bg-[#111119] p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-fuchsia-300/10 bg-fuchsia-400/[0.07] text-fuchsia-200">
                                    <GitCommit size={19} />
                                </div>

                                <div>
                                    <p className="text-sm text-zinc-200">Total commits</p>
                                    <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-white">
                                        {totalCommits !== null
                                            ? totalCommits.toLocaleString()
                                            : "—"}
                                    </p>
                                </div>
                            </div>

                            <span className="rounded-lg bg-white/[0.035] px-2 py-1 text-[11px] text-zinc-200">
                                Repository history
                            </span>
                        </div>
                    </div>
                </section>

                {/* AI introduction */}
                <section className="workspace-ai-banner relative mt-4 overflow-hidden rounded-2xl border border-violet-400/[0.17] bg-gradient-to-r from-violet-500/[0.09] via-[#171320] to-fuchsia-500/[0.045] p-4 sm:p-5">
                    <div className="pointer-events-none absolute -right-12 -top-20 h-40 w-40 rounded-full bg-violet-500/[0.12] blur-3xl" />

                    <div className="relative flex items-start gap-3 sm:gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-300/[0.09] text-violet-200">
                            <Sparkles size={20} />
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="font-semibold text-white">
                                    Understand code beyond the editor
                                </h2>

                                <span className="rounded-md border border-violet-300/15 bg-violet-300/[0.07] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-200">
                                    AI analysis
                                </span>
                            </div>

                            <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">
                                Review the source, identify input requirements, follow
                                the algorithm, and explore a reasoned prediction of
                                the program's behavior.
                            </p>
                        </div>
                    </div>
                </section>

                {error && (
                    <div
                        role="alert"
                        className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-200"
                    >
                        <CircleAlert size={18} className="mt-0.5 shrink-0" />

                        <div className="min-w-0">
                            <p className="font-medium">Unable to load source file</p>
                            <p className="mt-1 break-words leading-5 text-red-200/75">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {/* Explorer + preview */}
                <section className="mt-6 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[310px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">

                    {/* File explorer */}
                    <aside className="workspace-card min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101017]">
                        <div className="border-b border-white/[0.07] p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.045] text-zinc-200">
                                        <PanelLeft size={16} />
                                    </div>

                                    <h2 className="text-sm font-semibold text-white">
                                        Source explorer
                                    </h2>
                                </div>

                                <span className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[11px] tabular-nums text-zinc-400">
                                    {programs.length}
                                </span>
                            </div>

                            <p className="mt-2 text-xs text-zinc-200">
                                Select a file to inspect its source
                            </p>

                            <label className="workspace-search mt-4 flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#0b0b11] px-3 py-2.5 transition focus-within:border-violet-400/40 focus-within:ring-2 focus-within:ring-violet-400/[0.08]">
                                <Search
                                    size={16}
                                    aria-hidden="true"
                                    className="shrink-0 text-zinc-500"
                                />

                                <input
                                    type="text"
                                    value={filter}
                                    onChange={(event) => setFilter(event.target.value)}
                                    placeholder="Find a source file..."
                                    aria-label="Filter source files"
                                    className="w-full min-w-0 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                                />
                            </label>
                        </div>

                        {filteredPrograms.length > 0 ? (
                            <ul className="workspace-scrollbar max-h-[480px] overflow-y-auto p-2 sm:max-h-[580px]">
                                {filteredPrograms.map((program, index) => {
                                    const filePath = program?.path || program?.name;
                                    const isSelected = selectedPath === filePath;
                                    const isLoading = loadingPath === filePath;

                                    const lastUpdatedAt = getFileUpdatedAt(program);
                                    const relativeTime = formatRelativeTime(lastUpdatedAt);
                                    const exactDate = formatExactDate(lastUpdatedAt);

                                    return (
                                    
<li key={filePath || index}>
    <button
        type="button"
        onClick={() => handleSelectFile(program)}
        disabled={Boolean(loadingPath) || isExecuting}
        aria-current={isSelected ? "true" : undefined}
        className={`workspace-file group relative mb-1 flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-wait disabled:opacity-60 sm:px-3.5 ${
            isSelected
                ? "workspace-file-selected border-violet-400/20 bg-violet-500/[0.12] shadow-sm shadow-violet-950/20"
                : "border-transparent hover:border-white/[0.07] hover:bg-white/[0.035]"
        }`}
    >
        {/* Selected indicator */}
        {isSelected && (
            <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-violet-300" />
        )}

        {/* File icon */}
        <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors duration-200 ${
                isSelected
                    ? "border-violet-300/15 bg-violet-400/[0.14] text-violet-200"
                    : "border-white/[0.04] bg-white/[0.035] text-zinc-400 group-hover:text-zinc-200"
            }`}
        >
            {isLoading ? (
                <LoaderCircle size={18} className="animate-spin" />
            ) : (
                <FileCode2 size={18} />
            )}
        </div>

        {/* File information */}
        <div className="min-w-0 flex-1">

            {/* File name */}
            <p
                className={`break-words text-[13px] font-medium leading-5 ${
                    isSelected
                        ? "text-white"
                        : "text-zinc-300 group-hover:text-white"
                }`}
            >
                {filePath || "Source file"}
            </p>

            {/* Language */}
            <div className="mt-1">
                <span
                    className={`text-[11px] font-medium ${
                        isSelected
                            ? "text-violet-200/75"
                            : "text-zinc-400"
                    }`}
                >
                    {program?.language || "Source file"}
                </span>
            </div>

            {/* Last updated timestamp */}
            {relativeTime && (
                <div
                    className={`mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] font-medium ${
                        isSelected
                            ? "text-violet-300"
                            : "text-violet-300/90"
                    }`}
                    title={exactDate || "Last file update"}
                >
                    <Clock3
                        size={11}
                        className="shrink-0"
                    />

                    <span className="truncate">
                        Updated {relativeTime}
                    </span>
                </div>
            )}

            {/* Last commit message */}
            {program?.lastCommitMessage && (
                <div
                    className={`mt-1.5 flex min-w-0 items-start gap-1.5 text-[10px] leading-4 ${
                        isSelected
                            ? "text-amber-200/90"
                            : "text-amber-200/75"
                    }`}
                    title={program.lastCommitMessage}
                >
                    <GitCommit
                        size={11}
                        className="mt-0.5 shrink-0"
                    />

                    <p className="min-w-0 truncate">
                        {program.lastCommitMessage}
                    </p>
                </div>
            )}
        </div>

        {/* Selected check icon */}
        {isSelected && !isLoading && (
            <CheckCircle2
                size={16}
                className="shrink-0 text-violet-300"
            />
        )}
    </button>
</li>

                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="px-5 py-12 text-center">
                                <FileCode2 size={28} className="mx-auto text-zinc-600" />

                                <p className="mt-3 text-sm font-medium text-zinc-300">
                                    {programs.length
                                        ? "No matching files"
                                        : "No supported files found"}
                                </p>

                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                    {programs.length
                                        ? "Try another filename or clear the search."
                                        : "Try a repository containing supported source code."}
                                </p>
                            </div>
                        )}

                        <div className="border-t border-white/[0.06] px-4 py-3">
                            <p className="text-[11px] text-zinc-600">
                                {filteredPrograms.length} of {programs.length} files
                            </p>
                        </div>
                    </aside>

                    {/* Source preview */}
                    <section className="workspace-card min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101017]">
                        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-4 sm:p-5">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/10 bg-gradient-to-br from-violet-400/[0.13] to-fuchsia-400/[0.05] text-violet-200">
                                    <Code2 size={19} />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-sm font-semibold text-white">
                                        Source preview
                                    </h2>

                                    <p className="mt-1 break-all text-xs text-zinc-200">
                                        {source?.path || selectedPath || "Choose a file to get started"}
                                    </p>
                                </div>
                            </div>

                            {source && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.055] px-2.5 py-1.5 text-[11px] font-medium text-emerald-300">
                                    <FileCheck2 size={13} />
                                    Source loaded
                                </span>
                            )}
                        </div>

                        {loadingPath ? (
                            <div
                                role="status"
                                className="flex min-h-[340px] flex-col items-center justify-center px-5 text-center"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-400/[0.07]">
                                    <LoaderCircle size={24} className="animate-spin text-violet-300" />
                                </div>

                                <p className="mt-4 text-sm font-medium text-zinc-200">
                                    Loading source code
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                    Fetching the selected file from your repository.
                                </p>
                            </div>
                        ) : source ? (
                            <div className="min-w-0">
                                <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] bg-[#0d0d13] px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                        <Code2 size={14} className="text-violet-300" />
                                        {source.language}
                                    </div>

                                    <span className="text-[11px] text-zinc-600">
                                        Read-only
                                    </span>
                                </div>

                                <pre className="workspace-scrollbar min-h-[340px] max-h-[650px] overflow-auto bg-[#0c0c12] p-4 font-mono text-[12px] leading-6 text-zinc-300 selection:bg-violet-500/30 sm:p-5 sm:text-[13px]">
                                    <code>{source.code}</code>
                                </pre>
                            </div>
                        ) : (
                            <div className="relative flex min-h-[340px] flex-col items-center justify-center overflow-hidden px-6 py-12 text-center">
                                <div className="pointer-events-none absolute h-44 w-44 rounded-full bg-violet-600/[0.08] blur-3xl" />

                                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] text-zinc-400">
                                    <Code2 size={25} />
                                </div>

                                <h3 className="relative mt-4 text-sm font-semibold text-zinc-200">
                                    Your code, in focus
                                </h3>

                                <p className="relative mt-2 max-w-sm text-sm leading-6 text-zinc-400">
                                    Choose a source file from the explorer to inspect
                                    its contents and start an AI-assisted analysis.
                                </p>
                            </div>
                        )}
                    </section>
                </section>

                {/* AI analysis */}
                <section className="workspace-card mt-5 min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101017]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-4 sm:p-5">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/10 bg-violet-400/[0.08] text-violet-200">
                                <Brain size={19} />
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-sm font-semibold text-white">
                                    AI code analysis
                                </h2>

                                <p className="mt-1 text-xs leading-5 text-zinc-300">
                                    Review logic, input requirements, and predicted output.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={resetPrediction}
                            disabled={isExecuting}
                            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.02] px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-violet-300/20 hover:bg-violet-400/[0.06] hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>
                    </div>

                    <div className="p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={handleAnalyze}
                                disabled={!source || !selectedPath || isExecuting || Boolean(loadingPath)}
                                className="workspace-button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                {isExecuting ? (
                                    <>
                                        <LoaderCircle size={17} className="animate-spin" />
                                        Analyzing source...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={17} />
                                        Analyze with AI
                                        <ChevronRight size={15} />
                                    </>
                                )}
                            </button>

                            <p className="text-xs leading-5 text-zinc-300">
                                {source
                                    ? "Your selected file is ready for analysis."
                                    : "Select and load a source file to begin."}
                            </p>
                        </div>

                        {executionError && (
                            <div
                                role="alert"
                                className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-3.5 text-sm text-red-200"
                            >
                                <CircleAlert size={17} className="mt-0.5 shrink-0" />
                                <p className="break-words">{executionError}</p>
                            </div>
                        )}

                        {requiresUserInput && (
                            <div className="workspace-result-enter mt-5">
                                <ProgramInputPanel
                                    executionResult={executionResult}
                                    inputPrompt={inputPrompt}
                                    inputExplanation={inputExplanation}
                                    inputFormat={inputFormat}
                                    suggestedInputs={suggestedInputs}
                                    stdin={stdin}
                                    setStdin={setStdin}
                                    isExecuting={isExecuting}
                                    onSubmit={handleSubmitInputAndPredict}
                                />
                            </div>
                        )}

                        {executionResult && !requiresUserInput && (
                            <div className="workspace-result-enter mt-6 min-w-0">
                                <WorkspaceAnalysisResults
                                    executionResult={executionResult}
                                    repository={repository}
                                    selectedPath={selectedPath}
                                />
                            </div>
                        )}
                    </div>
                </section>

                <footer className="mt-5 flex flex-col gap-2 border-t border-white/[0.05] pt-4 text-[11px] leading-5 text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
                    <span className="inline-flex items-center gap-2">
                        <Sparkles size={13} className="text-violet-400/70" />
                        AI-assisted source analysis
                    </span>

                    <span>
                        Predictions are estimates, not verified execution results.
                    </span>
                </footer>
            </div >
        </main >
    );
}
