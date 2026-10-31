
import { memo } from "react";

const ResultSection = memo(function ResultSection({
    title,
    children,
    className = "",
}) {
    return (
        <section
            className={[
                "group relative mt-5 min-w-0 overflow-hidden",
                "rounded-2xl border border-white/[0.07]",
                "bg-gradient-to-br from-[#14141d] to-[#101017]",
                "p-4 transition-all duration-300 ease-out",
                "hover:border-violet-400/20",
                "hover:shadow-[0_8px_30px_rgba(124,58,237,0.06)]",
                "sm:p-5 lg:p-6",
                className,
            ].join(" ")}
        >
            {/* Subtle top highlight */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100"
            />

            {/* Section heading */}
            <div className="flex min-w-0 items-center gap-3">
                <span
                    aria-hidden="true"
                    className="h-5 w-1 shrink-0 rounded-full bg-violet-400/60 transition-all duration-300 group-hover:bg-violet-300 group-hover:shadow-[0_0_12px_rgba(167,139,250,0.3)]"
                />

                <h2 className="min-w-0 break-words text-base font-semibold tracking-tight text-zinc-100 sm:text-lg">
                    {title}
                </h2>
            </div>

            {/* Section content */}
            <div className="mt-4 min-w-0 break-words text-sm leading-7 text-zinc-300 [overflow-wrap:anywhere] sm:mt-5">
                {children}
            </div>
        </section>
    );
});

export default ResultSection;
