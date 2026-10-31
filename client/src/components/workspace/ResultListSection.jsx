
import { memo } from "react";
import { Check, List, ListOrdered } from "lucide-react";

import ResultSection from "./ResultSection";

function normalizeItem(item) {
    if (item === null || item === undefined) {
        return "";
    }

    if (typeof item === "string") {
        return item;
    }

    if (
        typeof item === "number" ||
        typeof item === "boolean"
    ) {
        return String(item);
    }

    if (typeof item === "object") {
        const value =
            item.message ??
            item.description ??
            item.title ??
            item.step ??
            item.issue ??
            item.explanation;

        if (value !== undefined && value !== null) {
            return typeof value === "string"
                ? value
                : String(value);
        }

        try {
            return JSON.stringify(item, null, 2);
        } catch {
            return String(item);
        }
    }

    return String(item);
}

const ResultListSection = memo(function ResultListSection({
    title,
    items,
    ordered = false,
    className = "",
}) {
    if (!Array.isArray(items) || items.length === 0) {
        return null;
    }

    const normalizedItems = items
        .map(normalizeItem)
        .filter((item) => item.trim() !== "");

    if (normalizedItems.length === 0) {
        return null;
    }

    const ListTag = ordered ? "ol" : "ul";
    const HeaderIcon = ordered ? ListOrdered : List;

    return (
        <ResultSection
            title={title}
            className={className}
        >
            {/* List metadata */}
            <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-500">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-400/10 bg-violet-500/[0.06]">
                        <HeaderIcon
                            size={14}
                            aria-hidden="true"
                            className="text-violet-300"
                        />
                    </span>

                    <span>
                        {ordered
                            ? "Step-by-step breakdown"
                            : "Analysis details"}
                    </span>
                </div>

                <span className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-xs tabular-nums text-zinc-400">
                    {normalizedItems.length}{" "}
                    {normalizedItems.length === 1
                        ? "item"
                        : "items"}
                </span>
            </div>

            {/* Analysis list */}
            <ListTag
                className="m-0 list-none space-y-2.5 p-0"
            >
                {normalizedItems.map((item, index) => (
                    <li
                        key={`${index}-${item.slice(0, 60)}`}
                        className={[
                            "group/item flex min-w-0 items-start gap-3",
                            "rounded-xl border border-white/[0.045]",
                            "bg-[#0d0d14] p-3.5",
                            "transition-all duration-200",
                            "hover:border-violet-400/20",
                            "hover:bg-violet-500/[0.035]",
                            "sm:p-4",
                        ].join(" ")}
                    >
                        {/* Item marker */}
                        <span
                            aria-hidden="true"
                            className={[
                                "flex h-7 w-7 shrink-0 items-center justify-center",
                                "rounded-lg border text-xs font-semibold tabular-nums",
                                "transition-all duration-200",
                                ordered
                                    ? "border-violet-400/20 bg-violet-500/[0.09] text-violet-200 group-hover/item:border-violet-400/35 group-hover/item:bg-violet-500/[0.15]"
                                    : "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300 group-hover/item:border-emerald-400/25",
                            ].join(" ")}
                        >
                            {ordered ? (
                                index + 1
                            ) : (
                                <Check size={14} strokeWidth={2.5} />
                            )}
                        </span>

                        {/* Item content */}
                        <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300 [overflow-wrap:anywhere]">
                            {item}
                        </p>
                    </li>
                ))}
            </ListTag>
        </ResultSection>
    );
});

export default ResultListSection;
