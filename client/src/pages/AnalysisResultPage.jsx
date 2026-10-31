
import {
    Brain,
    CheckCircle2,
    CircleAlert,
    Clipboard,
    Check,
    Code2,
    FileCode2,
    Info,
    AlertTriangle,
    BookOpen,
    GitBranch,
    Variable,
    RotateCcw,
    Lightbulb,
    Sparkles,
    Copy,
    ShieldCheck,
} from "lucide-react";

import { useEffect, useState } from "react";

import ResultSection from "../components/workspace/ResultSection";
import ResultListSection from "../components/workspace/ResultListSection";

function formatValue(value) {
    if (value === null || value === undefined) return "";

    if (typeof value === "string") return value;

    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function normalizeList(value) {
    if (value === null || value === undefined || value === "") {
        return [];
    }

    const items = Array.isArray(value) ? value : [value];

    return items
        .map((item) => {
            if (item && typeof item === "object") {
                return formatValue(
                    item.message ??
                    item.description ??
                    item.title ??
                    item.step ??
                    item.issue ??
                    item.explanation ??
                    item,
                );
            }

            return formatValue(item);
        })
        .filter((item) => item.trim() !== "");
}

function getField(...values) {
    return values.find(
        (value) => value !== null && value !== undefined,
    );
}

function getCompilationAssessment(result, analysis, executionResult) {
    const rawStatus = getField(
        result?.compilationLikely,
        analysis?.compilationLikely,
        executionResult?.compilationLikely,
        result?.compilationStatus,
        analysis?.compilationStatus,
        executionResult?.compilationStatus,
        result?.compilation,
        analysis?.compilation,
        executionResult?.compilation,
    );

    if (
        rawStatus === null ||
        rawStatus === undefined ||
        rawStatus === ""
    ) {
        return {
            value: "unknown",
            label: "Not assessed",
            color: "border-zinc-500/20 bg-zinc-500/[0.06] text-zinc-300",
            Icon: Info,
        };
    }

    if (typeof rawStatus === "boolean") {
        return rawStatus
            ? {
                value: "success",
                label: "Likely to compile",
                color: "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300",
                Icon: CheckCircle2,
            }
            : {
                value: "failure",
                label: "Likely compilation failure",
                color: "border-red-400/20 bg-red-400/[0.06] text-red-300",
                Icon: CircleAlert,
            };
    }

    const status = String(rawStatus).trim().toLowerCase();

    if (
        [
            "success",
            "likely_success",
            "likely success",
            "compiles",
            "compiled",
            "passed",
            "true",
        ].includes(status)
    ) {
        return {
            value: "success",
            label: "Likely to compile",
            color: "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300",
            Icon: CheckCircle2,
        };
    }

    if (
        [
            "failure",
            "likely_failure",
            "likely failure",
            "does_not_compile",
            "does not compile",
            "failed",
            "false",
            "error",
        ].includes(status)
    ) {
        return {
            value: "failure",
            label: "Likely compilation failure",
            color: "border-red-400/20 bg-red-400/[0.06] text-red-300",
            Icon: CircleAlert,
        };
    }

    return {
        value: "unknown",
        label: "Unable to determine",
        color: "border-amber-400/20 bg-amber-400/[0.06] text-amber-300",
        Icon: AlertTriangle,
    };
}

function DetailSection({
    title,
    description,
    icon: Icon,
    children,
}) {
    return (
        <section className="workspace-card group mt-5 min-w-0 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101017] transition-colors duration-300 hover:border-violet-400/[0.16]">
            <div className="flex items-start gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5">
                <div className="workspace-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/[0.14] bg-violet-500/[0.07] text-violet-300 transition duration-300 group-hover:border-violet-400/30 group-hover:bg-violet-500/[0.13] group-hover:text-violet-200">
                    <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="font-semibold tracking-tight text-zinc-100">
                        {title}
                    </h3>

                    {description && (
                        <p className="mt-1 text-xs leading-5 text-zinc-500 sm:text-sm">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            <div className="min-w-0 p-4 sm:p-5">
                {children}
            </div>
        </section>
    );
}

function DetailText({ value, fallback }) {
    const text = formatValue(value);

    if (!text.trim()) {
        return (
            <p className="text-sm leading-7 text-zinc-500">
                {fallback ||
                    "This section was not included in the AI response."}
            </p>
        );
    }

    return (
        <div className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300 [overflow-wrap:anywhere]">
            {text}
        </div>
    );
}

function DetailList({ items, ordered = false }) {
    if (!items.length) {
        return (
            <p className="text-sm leading-7 text-zinc-500">
                No details were provided for this section.
            </p>
        );
    }

    const ListTag = ordered ? "ol" : "ul";

    return (
        <ListTag
            className={
                ordered
                    ? "space-y-4"
                    : "list-disc space-y-3 pl-5 marker:text-violet-400"
            }
        >
            {items.map((item, index) => (
                <li
                    key={`${index}-${item.slice(0, 40)}`}
                    className={
                        ordered
                            ? "flex min-w-0 items-start gap-3"
                            : "break-words text-sm leading-7 text-zinc-300 [overflow-wrap:anywhere]"
                    }
                >
                    {ordered && (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-500/[0.08] text-xs font-semibold text-violet-300">
                            {index + 1}
                        </span>
                    )}

                    <span className="min-w-0 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300 [overflow-wrap:anywhere]">
                        {item}
                    </span>
                </li>
            ))}
        </ListTag>
    );
}

function InfoBanner() {
    return (
        <div className="workspace-card mt-5 overflow-hidden rounded-2xl border border-violet-400/[0.14] bg-gradient-to-br from-violet-500/[0.07] via-[#111118] to-[#111118] p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/[0.15] bg-violet-500/[0.08] text-violet-300">
                    <ShieldCheck size={19} />
                </div>

                <div className="min-w-0">
                    <h3 className="font-semibold text-zinc-100">
                        Understanding this result
                    </h3>

                    <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                        RepoRunner provides AI-generated code analysis and
                        output predictions. The dry run explains the expected
                        logic, but it does not prove the program was executed.
                        Compilation and runtime behavior have not been
                        independently verified by this workflow.
                    </p>
                </div>
            </div>
        </div>
    );
}

function EmptyAnalysisState() {
    return (
        <div className="workspace-card overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101017] p-6 sm:p-8">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] text-amber-300">
                    <CircleAlert size={25} />
                </div>

                <h2 className="mt-4 text-lg font-semibold tracking-tight text-white">
                    Analysis result unavailable
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                    No analysis result was provided. Select a source file and
                    request an analysis to see its results here.
                </p>
            </div>
        </div>
    );
}

export default function AnalysisResultPage({
    executionResult,
    selectedPath,
    repository,
}) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return undefined;

        const timeoutId = window.setTimeout(() => {
            setCopied(false);
        }, 1800);

        return () => window.clearTimeout(timeoutId);
    }, [copied]);

    const result = executionResult?.result || {};
    const analysis = executionResult?.analysis || {};

    const predictedOutput = getField(
        result.predictedOutput,
        result.output,
        result.stdout,
        analysis.predictedOutput,
        analysis.output,
        executionResult?.predictedOutput,
        executionResult?.output,
    );

    const explanation = getField(
        result.explanation,
        analysis.explanation,
        executionResult?.explanation,
    );

    const algorithm = getField(
        result.algorithm,
        analysis.algorithm,
        executionResult?.algorithm,
    );

    const variableAnalysis = getField(
        result.variableAnalysis,
        analysis.variableAnalysis,
        executionResult?.variableAnalysis,
    );

    const codeWalkthrough = normalizeList(
        getField(
            result.codeWalkthrough,
            analysis.codeWalkthrough,
            executionResult?.codeWalkthrough,
        ),
    );

    const dryRun = getField(
        result.dryRun,
        analysis.dryRun,
        executionResult?.dryRun,
    );

    const outputExplanation = getField(
        result.outputExplanation,
        analysis.outputExplanation,
        executionResult?.outputExplanation,
    );

    const suggestedFix = getField(
        result.suggestedFix,
        result.fix,
        analysis.suggestedFix,
        analysis.fix,
        executionResult?.suggestedFix,
        executionResult?.fix,
    );

    const logicSteps = normalizeList(
        getField(
            result.executionSteps,
            result.logicSteps,
            result.steps,
            analysis.executionSteps,
            analysis.logicSteps,
            analysis.steps,
            executionResult?.executionSteps,
        ),
    );

    const potentialIssues = normalizeList(
        getField(
            result.potentialIssues,
            result.issues,
            analysis.potentialIssues,
            analysis.issues,
            executionResult?.potentialIssues,
        ),
    );

    const compilationIssues = normalizeList(
        getField(
            result.compilationIssues,
            analysis.compilationIssues,
            executionResult?.compilationIssues,
        ),
    );

    const warnings = normalizeList(
        getField(
            result.warnings,
            analysis.warnings,
            executionResult?.warnings,
        ),
    );

    const limitations = normalizeList(
        getField(
            result.limitations,
            analysis.limitations,
            executionResult?.limitations,
        ),
    );

    const compilation = getCompilationAssessment(
        result,
        analysis,
        executionResult,
    );

    const CompilationIcon = compilation.Icon;

    const summary = getField(
        result.summary,
        analysis.summary,
        executionResult?.summary,
    );

    const confidence = getField(
        result.confidence,
        analysis.confidence,
        executionResult?.confidence,
    );

    const outputText = formatValue(predictedOutput);

    const fullResultText = [
        `Repository: ${repository || "Unknown"}`,
        `File: ${selectedPath || "Unknown"}`,
        `Compilation assessment: ${compilation.label}`,
        `Confidence: ${formatValue(confidence) || "Not provided"}`,
        "",
        "Summary:",
        formatValue(summary) || "No summary provided",
        "",
        "Algorithm:",
        formatValue(algorithm) || "Not provided",
        "",
        "Variable Analysis:",
        formatValue(variableAnalysis) || "Not provided",
        "",
        "Code Walkthrough:",
        codeWalkthrough.join("\n\n") || "Not provided",
        "",
        "Dry Run:",
        formatValue(dryRun) || "Not provided",
        "",
        "Predicted Output:",
        outputText || "No output provided",
        "",
        "Output Explanation:",
        formatValue(outputExplanation) || "Not provided",
        "",
        "General Explanation:",
        formatValue(explanation) || "Not provided",
        "",
        "Compilation Issues:",
        compilationIssues.join("\n") || "None provided",
        "",
        "Suggested Fix:",
        formatValue(suggestedFix) || "Not provided",
        "",
        "Execution Steps:",
        logicSteps.join("\n") || "Not provided",
        "",
        "Potential Issues:",
        potentialIssues.join("\n") || "None provided",
        "",
        "Warnings:",
        warnings.join("\n") || "None provided",
        "",
        "Limitations:",
        limitations.join("\n") || "None provided",
        "",
        "Note: This is an AI prediction, not verified compiler output.",
    ].join("\n");

    async function handleCopyResult() {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(fullResultText);
                setCopied(true);
                return;
            }
        } catch {
            // Try the fallback below.
        }

        let textArea;

        try {
            textArea = document.createElement("textarea");
            textArea.value = fullResultText;
            textArea.setAttribute("readonly", "");
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            textArea.style.opacity = "0";

            document.body.appendChild(textArea);
            textArea.select();

            if (document.execCommand("copy")) {
                setCopied(true);
                return;
            }
        } catch {
            // Use the manual copy option below.
        } finally {
            textArea?.remove();
        }

        window.prompt("Copy the analysis below:", fullResultText);
    }

    if (!executionResult) {
        return <EmptyAnalysisState />;
    }

    return (
        <section className="workspace-result-enter mt-8 min-w-0 border-t border-white/[0.07] pt-6 sm:pt-8">
            {/* Header */}
            <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.16] to-fuchsia-500/[0.05] text-violet-300">
                        <div className="absolute inset-0 bg-violet-400/[0.04] blur-xl" />
                        <Brain size={23} className="relative" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                                AI workspace
                            </span>

                            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/[0.16] bg-violet-500/[0.07] px-2 py-1 text-[10px] font-medium text-violet-200">
                                <Sparkles size={11} />
                                Code insights
                            </span>
                        </div>

                        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                            Analysis Results
                        </h2>

                        <p className="mt-2 break-words text-sm leading-6 text-zinc-400">
                            {repository || "Repository"}
                            {selectedPath ? ` / ${selectedPath}` : ""}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleCopyResult}
                    className="workspace-button-primary inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-zinc-300 transition duration-200 hover:border-violet-400/25 hover:bg-violet-500/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 active:scale-[0.98] sm:w-auto"
                >
                    {copied ? (
                        <Check size={16} className="text-emerald-300" />
                    ) : (
                        <Copy size={15} />
                    )}

                    {copied ? "Copied!" : "Copy full result"}
                </button>
            </header>

            {/* Program overview */}
            {summary && (
                <div className="workspace-card mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#15121f] via-[#101017] to-[#101017] p-4 sm:p-5">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-300">
                        <BookOpen size={17} />
                        Program Overview
                    </div>

                    <DetailText value={summary} />
                </div>
            )}

            {/* File and compilation status */}
            <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="workspace-card min-w-0 rounded-2xl border border-white/[0.07] bg-[#101017] p-4 transition-colors duration-200 hover:border-white/[0.13] sm:p-5">
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <FileCode2 size={17} className="text-violet-300" />
                        Source file
                    </div>

                    <p className="mt-3 break-all font-mono text-sm font-medium leading-6 text-zinc-200">
                        {selectedPath || "Not provided"}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
                        <Code2 size={13} />
                        <span>Repository source</span>
                    </div>
                </div>

                <div
                    className={`workspace-card min-w-0 rounded-2xl border p-4 transition-colors duration-200 sm:p-5 ${compilation.color}`}
                >
                    <div className="flex items-center gap-2 text-sm opacity-90">
                        <CompilationIcon size={17} />
                        Compilation assessment
                    </div>

                    <p className="mt-3 break-words text-sm font-semibold leading-6">
                        {compilation.label}
                    </p>

                    <p className="mt-2 text-xs leading-5 opacity-75">
                        AI assessment only. A compiler has not independently
                        verified this result.
                    </p>
                </div>
            </div>

            {confidence !== null &&
                confidence !== undefined &&
                formatValue(confidence).trim() !== "" && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <Brain size={14} className="text-violet-300" />
                        <span>AI confidence:</span>
                        <span className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 capitalize text-zinc-300">
                            {formatValue(confidence)}
                        </span>
                    </div>
                )}

            {/* Compilation issues */}
            <ResultListSection
                title="Likely Compilation Issues"
                items={compilationIssues}
            />

            <InfoBanner />

            {/* Predicted output */}
            <ResultSection title="Predicted Output">
                {outputText !== "" ? (
                    <div className="min-w-0 overflow-hidden rounded-2xl border border-emerald-400/[0.14] bg-[#09090f]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.02] px-3 py-3 sm:px-4">
                            <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-400">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-400/[0.15] bg-emerald-400/[0.06] text-emerald-300">
                                    <Code2 size={14} />
                                </div>

                                <span>Predicted console output</span>
                            </div>

                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-400/[0.14] bg-amber-400/[0.05] px-2.5 py-1 text-[10px] font-medium text-amber-200">
                                <Info size={11} />
                                Not executed
                            </span>
                        </div>

                        <pre className="workspace-scrollbar max-h-[420px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[13px] leading-7 text-emerald-300 sm:p-5 sm:text-sm [overflow-wrap:anywhere]">
                            {outputText}
                        </pre>
                    </div>
                ) : (
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                        <div className="flex items-start gap-3">
                            <Info
                                size={17}
                                className="mt-0.5 shrink-0 text-zinc-500"
                            />

                            <p className="text-sm leading-6 text-zinc-500">
                                {compilation.value === "failure"
                                    ? "The AI predicts a likely compilation failure. An output prediction may not be available until the reported issues are fixed."
                                    : "No predicted output was included in the response. The output may depend on missing input or runtime information."}
                            </p>
                        </div>
                    </div>
                )}
            </ResultSection>

            {/* Algorithm */}
            <DetailSection
                title="Algorithm"
                description="The overall approach used to solve the problem."
                icon={GitBranch}
            >
                <DetailText value={algorithm} />
            </DetailSection>

            {/* Variable analysis */}
            <DetailSection
                title="Variable Analysis"
                description="What each important variable stores and how it is used."
                icon={Variable}
            >
                <DetailText value={variableAnalysis} />
            </DetailSection>

            {/* Code walkthrough */}
            <DetailSection
                title="Code Walkthrough"
                description="A source-ordered explanation of the important statements."
                icon={BookOpen}
            >
                <DetailList items={codeWalkthrough} ordered />
            </DetailSection>

            {/* Dry run */}
            <DetailSection
                title="Dry Run"
                description="Follow the program's logic using the supplied input."
                icon={RotateCcw}
            >
                <DetailText
                    value={dryRun}
                    fallback="A detailed dry run was not included. Check whether the backend returned the dryRun field."
                />
            </DetailSection>

            {/* Output explanation */}
            <DetailSection
                title="How the Output Is Formed"
                description="Why the program produces the predicted result."
                icon={Code2}
            >
                <DetailText value={outputExplanation} />
            </DetailSection>

            {/* General explanation */}
            <ResultSection title="Detailed Explanation">
                <DetailText
                    value={explanation}
                    fallback="No general explanation was provided."
                />
            </ResultSection>

            {/* Suggested fix */}
            <ResultSection title="Suggested Fix">
                {suggestedFix !== null &&
                suggestedFix !== undefined &&
                formatValue(suggestedFix).trim() !== "" ? (
                    <pre className="workspace-scrollbar max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/[0.07] bg-[#09090f] p-4 font-mono text-sm leading-7 text-zinc-300 [overflow-wrap:anywhere]">
                        {formatValue(suggestedFix)}
                    </pre>
                ) : (
                    <p className="text-sm leading-7 text-zinc-500">
                        No suggested fix was provided.
                    </p>
                )}
            </ResultSection>

            {/* Remaining analysis sections */}
            <ResultListSection
                title="Step-by-Step Logic"
                items={logicSteps}
                ordered
            />

            <ResultListSection
                title="Potential Issues"
                items={potentialIssues}
            />

            <ResultListSection
                title="Warnings"
                items={warnings}
            />

            <ResultListSection
                title="Limitations"
                items={limitations}
            />

            {/* Learning tip */}
            {potentialIssues.length > 0 && (
                <div className="workspace-card mt-5 overflow-hidden rounded-2xl border border-amber-400/[0.14] bg-gradient-to-br from-amber-400/[0.05] to-transparent p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/[0.15] bg-amber-400/[0.06] text-amber-300">
                            <Lightbulb size={19} />
                        </div>

                        <div className="min-w-0">
                            <h3 className="font-semibold text-zinc-100">
                                Learning tip
                            </h3>

                            <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                                Review the potential issues alongside the
                                variable analysis and dry run. Understanding
                                how values change is often the easiest way
                                to spot logic errors.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
