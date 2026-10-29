
import {
    AlertTriangle,
    Check,
    Code2,
    Info,
    LoaderCircle,
    Play,
    Sparkles,
    Terminal,
} from "lucide-react";

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

function InfoCard({ icon: Icon, title, children, variant = "default" }) {
    const variants = {
        default: {
            container: "border-white/[0.07] bg-white/[0.02]",
            icon: "bg-white/[0.05] text-zinc-400",
            title: "text-zinc-200",
        },
        violet: {
            container: "border-violet-400/20 bg-violet-500/[0.045]",
            icon: "bg-violet-400/10 text-violet-300",
            title: "text-violet-200",
        },
    };

    const style = variants[variant] || variants.default;

    return (
        <div
            className={`rounded-xl border p-4 transition-colors duration-200 ${style.container}`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.icon}`}
                >
                    <Icon size={16} />
                </div>

                <div className="min-w-0 flex-1">
                    <h4 className={`text-sm font-medium ${style.title}`}>
                        {title}
                    </h4>

                    <div className="mt-2 min-w-0">{children}</div>
                </div>
            </div>
        </div>
    );
}

export default function ProgramInputPanel({
    executionResult,
    inputPrompt,
    inputExplanation,
    inputFormat,
    suggestedInputs,
    stdin,
    setStdin,
    isExecuting,
    onSubmit,
}) {
    const samples = Array.isArray(suggestedInputs)
        ? suggestedInputs
            .map((sample) => formatValue(sample))
            .filter((sample) => sample !== "")
        : [];

    const message =
        executionResult?.message ||
        executionResult?.inputPlan?.message ||
        "This program appears to require standard input before its output can be predicted.";

    const summary = executionResult?.analysis?.summary;
    const prompt =
        typeof inputPrompt === "string" ? inputPrompt.trim() : "";

    const explanation =
        typeof inputExplanation === "string"
            ? inputExplanation.trim()
            : "";

    const expectedFormat = formatValue(inputFormat);
    const inputLength = typeof stdin === "string" ? stdin.length : 0;

    return (
        <section className="mt-6 overflow-hidden rounded-2xl border border-violet-400/15 bg-[#101019] shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
            {/* Header */}
            <div className="border-b border-white/[0.07] bg-gradient-to-r from-violet-500/[0.09] via-transparent to-transparent p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/15 bg-amber-300/[0.08] text-amber-300">
                        <Terminal size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold tracking-tight text-white">
                                Program input required
                            </h3>

                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-200">
                                <AlertTriangle size={11} />
                                Waiting for input
                            </span>
                        </div>

                        <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                            {message}
                        </p>
                    </div>
                </div>

                {summary && (
                    <p className="mt-4 rounded-lg border border-white/[0.05] bg-black/10 px-3 py-2.5 text-sm leading-6 text-zinc-400">
                        {formatValue(summary)}
                    </p>
                )}
            </div>

            <div className="space-y-4 p-4 sm:p-5">
                {/* Actual prompt from source analysis */}
                {prompt && (
                    <InfoCard
                        icon={Code2}
                        title="Detected program prompt"
                        variant="violet"
                    >
                        <div className="overflow-hidden rounded-lg border border-violet-400/10 bg-[#09090f]">
                            <div className="flex items-center gap-2 border-b border-white/[0.05] px-3 py-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                                <span className="text-[11px] text-zinc-500">
                                    Expected console message
                                </span>
                            </div>

                            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-sm leading-6 text-violet-100 [scrollbar-color:rgba(167,139,250,0.4)_transparent] [scrollbar-width:thin]">
                                {prompt}
                            </pre>
                        </div>
                    </InfoCard>
                )}

                {/* Explanation */}
                {explanation && (
                    <InfoCard icon={Info} title="What you need to enter">
                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-400">
                            {explanation}
                        </p>
                    </InfoCard>
                )}

                {/* Expected input format */}
                {expectedFormat && (
                    <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/[0.08] text-emerald-300">
                            <Check size={15} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-zinc-300">
                                Expected input format
                            </p>

                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-400">
                                {expectedFormat}
                            </p>
                        </div>
                    </div>
                )}

                {/* Input editor */}
                <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#09090f] transition-colors duration-200 focus-within:border-violet-400/40 focus-within:ring-2 focus-within:ring-violet-500/[0.08]">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-3.5 py-3 sm:px-4">
                        <label
                            htmlFor="program-stdin"
                            className="flex items-center gap-2 text-sm font-medium text-zinc-200"
                        >
                            <Code2 size={15} className="text-violet-300" />
                            Standard input
                        </label>

                        <span className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 font-mono text-[10px] text-zinc-500">
                            stdin
                        </span>
                    </div>

                    <textarea
                        id="program-stdin"
                        name="stdin"
                        value={stdin}
                        onChange={(event) => setStdin(event.target.value)}
                        placeholder={
                            samples.length > 0
                                ? `Example input:\n${samples[0]}`
                                : expectedFormat
                                    ? `Enter input: ${expectedFormat}`
                                    : "Type the values your program reads..."
                        }
                        disabled={isExecuting}
                        maxLength={10000}
                        rows={5}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                        className="block min-h-32 w-full resize-y bg-transparent p-4 font-mono text-sm leading-7 text-zinc-200 outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 [scrollbar-color:rgba(167,139,250,0.4)_transparent] [scrollbar-width:thin]"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.05] px-3.5 py-2.5 sm:px-4">
                        <p className="text-xs text-zinc-500">
                            Enter values in the order your program requests them.
                        </p>

                        <p
                            className={`shrink-0 font-mono text-xs ${
                                inputLength >= 9500
                                    ? "text-amber-300"
                                    : "text-zinc-500"
                            }`}
                        >
                            {inputLength.toLocaleString()}/10,000
                        </p>
                    </div>
                </div>

                {/* Suggested examples */}
                {samples.length > 0 && (
                    <div>
                        <div className="mb-2.5 flex items-center gap-2">
                            <Sparkles
                                size={14}
                                className="text-violet-300"
                            />

                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                                Try an example
                            </p>

                            <span className="text-xs text-zinc-600">
                                · {samples.length} available
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {samples.map((sample, index) => {
                                const isSelected = stdin === sample;

                                return (
                                    <button
                                        key={`${index}-${sample}`}
                                        type="button"
                                        onClick={() => setStdin(sample)}
                                        disabled={isExecuting}
                                        aria-pressed={isSelected}
                                        title="Fill the input editor with this example"
                                        className={`group inline-flex max-w-full min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left font-mono text-xs transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                                            isSelected
                                                ? "border-violet-400/40 bg-violet-400/[0.10] text-violet-100"
                                                : "border-white/[0.08] bg-white/[0.025] text-zinc-300 hover:border-violet-400/30 hover:bg-violet-500/[0.08] hover:text-violet-100"
                                        }`}
                                    >
                                        {isSelected ? (
                                            <Check
                                                size={13}
                                                className="shrink-0 text-violet-300"
                                            />
                                        ) : (
                                            <Code2
                                                size={13}
                                                className="shrink-0 text-zinc-500 transition-colors group-hover:text-violet-300"
                                            />
                                        )}

                                        <span className="break-all">
                                            {sample}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <p className="mt-2 text-xs leading-5 text-zinc-500">
                            Examples only fill the editor. Review or edit the
                            input before submitting.
                        </p>
                    </div>
                )}

                {/* Submit */}
                <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-zinc-500">
                        RepoRunner predicts the result with AI; it does not
                        execute your program.
                    </p>

                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isExecuting}
                        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(124,58,237,0.12)] transition-all duration-200 hover:bg-violet-500 hover:shadow-[0_4px_20px_rgba(139,92,246,0.22)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none sm:w-auto"
                    >
                        {isExecuting ? (
                            <>
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                                Predicting output...
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                Submit input & predict
                            </>
                        )}
                    </button>
                </div>
            </div>
        </section>
    );
}
