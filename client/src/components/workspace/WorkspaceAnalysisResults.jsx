import { useState } from "react";
import {
    AlertTriangle,
    Brain,
    CheckCircle2,
    CircleAlert,
    Clipboard,
    Code2,
    GitBranch,
    Info,
    Lightbulb,
    Maximize2,
    RotateCcw,
    Sparkles,
    Variable,
    X,
} from "lucide-react";

import ResultSection from "./ResultSection";
import ResultListSection from "./ResultListSection";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatValue(value) {
    if (value === null || value === undefined) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function toDisplayList(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return [];
    }

    const items = Array.isArray(value) ? value : [value];

    return items
        .map((item) => {
            if (item === null || item === undefined) {
                return "";
            }

            if (typeof item === "object") {
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

            return String(item);
        })
        .filter((item) => item.trim() !== "");
}

function getField(...values) {
    return values.find(
        (value) =>
            value !== null &&
            value !== undefined &&
            value !== "",
    );
}

function normalizeCompilationStatus(
    result,
    analysis,
    executionResult,
) {
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

    if (rawStatus === undefined) {
        return {
            value: "unknown",
            label: "Not assessed",
            description:
                "The AI did not provide a clear compilation assessment.",
            color:
                "border-zinc-500/20 bg-zinc-500/[0.06] text-zinc-300",
            icon: Info,
        };
    }

    const normalized = String(rawStatus)
        .trim()
        .toLowerCase()
        .replaceAll("-", "_");

    if (
        [
            "success",
            "likely_success",
            "likely success",
            "compiles",
            "passed",
            "true",
        ].includes(normalized)
    ) {
        return {
            value: "success",
            label: "Likely to compile",
            description:
                "The AI expects the source code to compile successfully.",
            color:
                "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300",
            icon: CheckCircle2,
        };
    }

    if (
        [
            "failure",
            "likely_failure",
            "likely failure",
            "does_not_compile",
            "failed",
            "false",
        ].includes(normalized)
    ) {
        return {
            value: "failure",
            label: "Likely compilation failure",
            description:
                "The AI identified possible compilation errors in the source.",
            color:
                "border-red-400/20 bg-red-400/[0.06] text-red-300",
            icon: CircleAlert,
        };
    }

    return {
        value: "unknown",
        label: "Unable to determine",
        description:
            "The AI could not confidently determine whether the code compiles.",
        color:
            "border-amber-400/20 bg-amber-400/[0.06] text-amber-300",
        icon: AlertTriangle,
    };
}

/* -------------------------------------------------------------------------- */
/* Reusable result components                                                 */
/* -------------------------------------------------------------------------- */

function DetailSection({
    title,
    icon: Icon,
    children,
}) {
    return (
        <ResultSection title={title}>
            <div className="space-y-3">
                {Icon && (
                    <div className="flex items-center gap-2 text-xs font-medium text-violet-300">
                        <Icon size={15} />
                        <span>Analysis details</span>
                    </div>
                )}

                {children}
            </div>
        </ResultSection>
    );
}

function DetailText({
    value,
    emptyMessage = "No details provided.",
}) {
    const text = formatValue(value);

    if (!text) {
        return (
            <p className="text-sm leading-6 text-zinc-500">
                {emptyMessage}
            </p>
        );
    }

    return (
        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">
            {text}
        </p>
    );
}

function DetailList({
    items,
    ordered = false,
}) {
    const list = toDisplayList(items);

    if (list.length === 0) {
        return (
            <p className="text-sm leading-6 text-zinc-500">
                No details provided.
            </p>
        );
    }

    const ListTag = ordered ? "ol" : "ul";

    return (
        <ListTag
            className={`space-y-3 pl-5 text-sm leading-7 text-zinc-300 ${
                ordered ? "list-decimal" : "list-disc"
            }`}
        >
            {list.map((item, index) => (
                <li
                    key={`${index}-${item.slice(0, 40)}`}
                    className="break-words pl-1 marker:text-violet-400"
                >
                    {item}
                </li>
            ))}
        </ListTag>
    );
}

function VariableAnalysis({ value }) {
    if (!Array.isArray(value) || value.length === 0) {
        return <DetailText value={value} />;
    }

    return (
        <div className="space-y-3">
            {value.map((item, index) => {
                if (
                    typeof item !== "object" ||
                    item === null
                ) {
                    return (
                        <div
                            key={index}
                            className="rounded-xl border border-white/[0.08] bg-[#09090f] p-4"
                        >
                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">
                                {formatValue(item)}
                            </p>
                        </div>
                    );
                }

                const name =
                    item.name ??
                    item.variable ??
                    item.identifier ??
                    `Variable ${index + 1}`;

                const type = getField(
                    item.type,
                    item.dataType,
                );

                const initialValue = getField(
                    item.initialValue,
                    item.initial,
                );

                const finalValue = getField(
                    item.finalValue,
                    item.final,
                );

                const changes = getField(
                    item.changes,
                    item.valueChanges,
                );

                const purpose = getField(
                    item.purpose,
                    item.description,
                    item.explanation,
                );

                return (
                    <div
                        key={`${name}-${index}`}
                        className="rounded-xl border border-white/[0.08] bg-[#09090f] p-4 transition-colors hover:border-violet-400/20"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-500/[0.08]">
                                <Variable
                                    size={17}
                                    className="text-violet-300"
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h4 className="break-words font-mono text-sm font-semibold text-white">
                                    {formatValue(name)}
                                </h4>

                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    {type !== undefined && (
                                        <div className="min-w-0 rounded-lg bg-white/[0.025] p-3">
                                            <p className="text-xs text-zinc-500">
                                                Type
                                            </p>

                                            <p className="mt-1 break-words text-sm text-zinc-300">
                                                {formatValue(type)}
                                            </p>
                                        </div>
                                    )}

                                    {initialValue !== undefined && (
                                        <div className="min-w-0 rounded-lg bg-white/[0.025] p-3">
                                            <p className="text-xs text-zinc-500">
                                                Initial value
                                            </p>

                                            <p className="mt-1 break-words font-mono text-sm text-emerald-300">
                                                {formatValue(initialValue)}
                                            </p>
                                        </div>
                                    )}

                                    {finalValue !== undefined && (
                                        <div className="min-w-0 rounded-lg bg-white/[0.025] p-3">
                                            <p className="text-xs text-zinc-500">
                                                Final value
                                            </p>

                                            <p className="mt-1 break-words font-mono text-sm text-emerald-300">
                                                {formatValue(finalValue)}
                                            </p>
                                        </div>
                                    )}

                                    {changes !== undefined && (
                                        <div className="min-w-0 rounded-lg bg-white/[0.025] p-3">
                                            <p className="text-xs text-zinc-500">
                                                Value changes
                                            </p>

                                            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-300">
                                                {formatValue(changes)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {purpose !== undefined && (
                                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-400">
                                        {formatValue(purpose)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

export default function WorkspaceAnalysisResults({
    executionResult,
    repository,
    selectedPath,
}) {
    const [showFullResult, setShowFullResult] = useState(false);
    const [copyMessage, setCopyMessage] = useState("");

    if (!executionResult) {
        return null;
    }

    const result = executionResult.result || {};
    const analysis = executionResult.analysis || {};

    const compilation = normalizeCompilationStatus(
        result,
        analysis,
        executionResult,
    );

    const CompilationIcon = compilation.icon;

    const predictedOutput = getField(
        result.predictedOutput,
        result.output,
        result.stdout,
        analysis.predictedOutput,
        executionResult.predictedOutput,
        executionResult.output,
    );

    const summary = getField(
        result.summary,
        analysis.summary,
        executionResult.summary,
    );

    const explanation = getField(
        result.explanation,
        analysis.explanation,
        executionResult.explanation,
    );

    const algorithm = getField(
        result.algorithm,
        analysis.algorithm,
        executionResult.algorithm,
    );

    const variableAnalysis = getField(
        result.variableAnalysis,
        analysis.variableAnalysis,
        executionResult.variableAnalysis,
    );

    const codeWalkthrough = toDisplayList(
        getField(
            result.codeWalkthrough,
            analysis.codeWalkthrough,
            executionResult.codeWalkthrough,
        ),
    );

    const dryRun = getField(
        result.dryRun,
        analysis.dryRun,
        executionResult.dryRun,
    );

    const outputExplanation = getField(
        result.outputExplanation,
        analysis.outputExplanation,
        executionResult.outputExplanation,
    );

    const suggestedFix = getField(
        result.suggestedFix,
        result.fix,
        analysis.suggestedFix,
        executionResult.suggestedFix,
    );

    const logicSteps = toDisplayList(
        getField(
            result.logicSteps,
            result.executionSteps,
            result.steps,
            analysis.logicSteps,
            analysis.executionSteps,
            executionResult.executionSteps,
        ),
    );

    const potentialIssues = toDisplayList(
        getField(
            result.potentialIssues,
            result.issues,
            analysis.potentialIssues,
            analysis.issues,
            executionResult.potentialIssues,
        ),
    );

    const compilationIssues = toDisplayList(
        getField(
            result.compilationIssues,
            analysis.compilationIssues,
            executionResult.compilationIssues,
        ),
    );

    const warnings = toDisplayList(
        getField(
            result.warnings,
            analysis.warnings,
            executionResult.warnings,
        ),
    );

    const limitations = toDisplayList(
        getField(
            result.limitations,
            analysis.limitations,
            executionResult.limitations,
        ),
    );

    const confidence = getField(
        result.confidence,
        analysis.confidence,
        executionResult.confidence,
    );

    async function handleCopyResult() {
        const text = [
            `Repository: ${repository || "Unknown"}`,
            `File: ${selectedPath || "Unknown"}`,
            `Compilation assessment: ${compilation.label}`,
            "",
            "Program overview:",
            formatValue(summary) || "No summary provided",
            "",
            "Algorithm:",
            formatValue(algorithm) || "Not provided",
            "",
            "Variable analysis:",
            formatValue(variableAnalysis) || "Not provided",
            "",
            "Code walkthrough:",
            codeWalkthrough.join("\n") || "Not provided",
            "",
            "Dry run:",
            formatValue(dryRun) || "Not provided",
            "",
            "Predicted output:",
            formatValue(predictedOutput) || "No output provided",
            "",
            "How the output is formed:",
            formatValue(outputExplanation) || "Not provided",
            "",
            "Explanation:",
            formatValue(explanation) || "No explanation provided",
            "",
            "Suggested fix:",
            formatValue(suggestedFix) || "No fix provided",
            "",
            "Step-by-step logic:",
            logicSteps.join("\n") || "Not provided",
            "",
            "Compilation issues:",
            compilationIssues.join("\n") || "None provided",
            "",
            "Potential issues:",
            potentialIssues.join("\n") || "None provided",
            "",
            "Warnings:",
            warnings.join("\n") || "None provided",
            "",
            "Limitations:",
            limitations.join("\n") || "None provided",
            "",
            `AI confidence: ${formatValue(confidence) || "Not provided"}`,
            "",
            "Note: This is an AI prediction, not verified compiler output.",
        ].join("\n");

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement("textarea");

                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";

                document.body.appendChild(textArea);
                textArea.select();

                const copied = document.execCommand("copy");
                textArea.remove();

                if (!copied) {
                    window.prompt("Copy the analysis below:", text);
                    return;
                }
            }

            setCopyMessage("Analysis copied to clipboard.");
        } catch {
            window.prompt("Copy the analysis below:", text);
        }
    }

    const resultContent = (
        <section className="space-y-5">
            {/* Analysis overview */}
            <div className="overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.09] via-[#111118] to-[#111118] p-4 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10">
                            <Brain
                                size={22}
                                className="text-violet-300"
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-semibold text-white sm:text-xl">
                                    AI Analysis Results
                                </h2>

                                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                                    <Sparkles size={12} />
                                    AI predicted
                                </span>
                            </div>

                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-400">
                                {formatValue(summary) ||
                                    "Analysis completed. Review the assessment and prediction below."}
                            </p>

                            <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-500">
                                {repository && (
                                    <p className="break-all">
                                        Repository: {repository}
                                    </p>
                                )}

                                <p className="break-all">
                                    File: {selectedPath || "Unknown"}
                                </p>

                                {confidence !== undefined && (
                                    <p>
                                        AI confidence:{" "}
                                        <span className="font-medium text-zinc-300">
                                            {formatValue(confidence)}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setShowFullResult((current) => !current)
                            }
                            aria-expanded={showFullResult}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-300 transition hover:border-violet-400/30 hover:bg-violet-500/[0.07] hover:text-white"
                        >
                            {showFullResult ? (
                                <X size={15} />
                            ) : (
                                <Maximize2 size={15} />
                            )}

                            {showFullResult
                                ? "Close full view"
                                : "Expand results"}
                        </button>

                        <button
                            type="button"
                            onClick={handleCopyResult}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
                        >
                            <Clipboard size={15} />
                            Copy results
                        </button>
                    </div>
                </div>

                {copyMessage && (
                    <p
                        role="status"
                        className="mt-4 flex items-center gap-2 text-xs text-emerald-300"
                    >
                        <CheckCircle2 size={14} />
                        {copyMessage}
                    </p>
                )}
            </div>

            {/* Compilation assessment */}
            <div
                className={`rounded-2xl border p-4 sm:p-5 ${compilation.color}`}
            >
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-current/10 bg-black/10">
                        <CompilationIcon size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">
                                Compilation Assessment
                            </h3>

                            <span className="rounded-full border border-current/15 bg-black/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">
                                AI estimate
                            </span>
                        </div>

                        <p className="mt-1 text-sm font-medium">
                            {compilation.label}
                        </p>

                        <p className="mt-2 text-sm leading-6 opacity-80">
                            {compilation.description}
                        </p>

                        <p className="mt-2 text-xs leading-5 opacity-70">
                            This is an AI assessment. RepoRunner has not
                            verified the result using a compiler.
                        </p>
                    </div>
                </div>
            </div>

            {compilationIssues.length > 0 && (
                <ResultListSection
                    title="Likely Compilation Issues"
                    items={compilationIssues}
                />
            )}

            {/* Predicted output */}
            <ResultSection title="Predicted Output">
                {predictedOutput !== undefined &&
                formatValue(predictedOutput) !== "" ? (
                    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#09090f]">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <Code2
                                    size={14}
                                    className="text-emerald-300"
                                />
                                Predicted console output
                            </div>

                            <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1 text-[10px] font-medium text-emerald-300">
                                Not executed
                            </span>
                        </div>

                        <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-sm leading-6 text-emerald-300">
                            {formatValue(predictedOutput)}
                        </pre>
                    </div>
                ) : (
                    <p className="text-sm leading-6 text-zinc-500">
                        {compilation.value === "failure"
                            ? "The AI predicts that this program may not compile, so it did not provide a predicted output. Review the compilation issues and suggested fix."
                            : "No predicted output was provided. Review the explanation and compilation assessment."}
                    </p>
                )}
            </ResultSection>

            {/* Program overview */}
            <DetailSection
                title="Program Overview"
                icon={Sparkles}
            >
                <DetailText value={summary} />
            </DetailSection>

            {/* Algorithm */}
            <DetailSection
                title="Algorithm"
                icon={GitBranch}
            >
                <DetailText value={algorithm} />
            </DetailSection>

            {/* Variables */}
            <DetailSection
                title="Variable Analysis"
                icon={Variable}
            >
                <VariableAnalysis value={variableAnalysis} />
            </DetailSection>

            {/* Code walkthrough */}
            <DetailSection
                title="Code Walkthrough"
                icon={Code2}
            >
                <DetailList
                    items={codeWalkthrough}
                    ordered
                />
            </DetailSection>

            {/* Dry run */}
            <DetailSection
                title="Dry Run"
                icon={RotateCcw}
            >
                <DetailText value={dryRun} />
            </DetailSection>

            {/* Output explanation */}
            <DetailSection
                title="How the Output Is Formed"
                icon={Lightbulb}
            >
                <DetailText value={outputExplanation} />
            </DetailSection>

            {/* Detailed explanation */}
            <ResultSection title="Detailed Explanation">
                <DetailText value={explanation} />
            </ResultSection>

            {/* Suggested fix */}
            <ResultSection title="Suggested Fix">
                {suggestedFix ? (
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-white/[0.08] bg-[#09090f] p-4 font-mono text-sm leading-6 text-zinc-300">
                        {formatValue(suggestedFix)}
                    </pre>
                ) : (
                    <p className="text-sm leading-6 text-zinc-500">
                        No suggested fix was provided.
                    </p>
                )}
            </ResultSection>

            {/* Additional analysis lists */}
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
        </section>
    );

    return (
        <>
            {resultContent}

            {showFullResult && (
                <div
                    className="fixed inset-0 z-50 overflow-y-auto bg-[#09090f]/95 p-3 backdrop-blur-md sm:p-6 lg:p-8"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Full AI analysis results"
                >
                    <div className="mx-auto max-w-5xl">
                        <div className="mb-5 flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <Brain
                                        size={20}
                                        className="shrink-0 text-violet-300"
                                    />

                                    <h2 className="text-lg font-semibold text-white sm:text-xl">
                                        Full AI Analysis
                                    </h2>
                                </div>

                                <p className="mt-2 break-all text-sm text-zinc-500">
                                    {repository || "Repository"} /{" "}
                                    {selectedPath || "Unknown file"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowFullResult(false)}
                                aria-label="Close full analysis"
                                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
                            >
                                <X size={16} />
                                <span className="hidden sm:inline">
                                    Close
                                </span>
                            </button>
                        </div>

                        {resultContent}
                    </div>
                </div>
            )}
        </>
    );
}