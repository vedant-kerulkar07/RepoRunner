
import { useState } from "react";
import {
    ArrowRight,
    Check,
    CircleDot,
    FileCode2,
    FolderGit2,
    GitBranch,
    LoaderCircle,
    LockKeyhole,
    Search,
    ShieldCheck,
    Sparkles,
    Terminal,
    X,
} from "lucide-react";

import { analyzeRepository } from "../../services/repository.service";
import RepositoryAnalyzerResults from "./RepositoryAnalyzerResults";

function AnalysisSkeleton() {
    return (
        <div
            role="status"
            aria-label="Analyzing repository"
            className="mt-10 space-y-5 animate-pulse"
        >
            <div className="h-6 w-56 rounded-lg bg-white/[0.07]" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="h-32 rounded-2xl border border-white/[0.07] bg-[#111118]"
                    />
                ))}
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#111118] p-5">
                <div className="h-5 w-44 rounded bg-white/[0.07]" />

                <div className="mt-6 space-y-4">
                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="h-12 rounded-xl bg-white/[0.04]"
                        />
                    ))}
                </div>
            </div>

            <span className="sr-only">
                Analyzing repository. Please wait.
            </span>
        </div>
    );
}

function HeroCodePreview() {
    return (
        <div
            aria-label="Illustration of a code workspace"
            className="relative mx-auto w-full max-w-[470px]"
        >
            <div className="absolute -inset-5 rounded-[40px] bg-violet-600/[0.10] blur-3xl" />

            <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-[#101017] shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5">
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#f5bf4f]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#54c78b]" />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <FileCode2 size={14} />
                        main.c
                    </div>

                    <div className="w-10" />
                </div>

                <div className="flex min-w-0">
                    <div className="hidden w-12 shrink-0 border-r border-white/[0.05] py-5 text-right font-mono text-xs leading-7 text-zinc-700 sm:block sm:pr-3">
                        {Array.from({ length: 9 }, (_, i) => (
                            <div key={i}>{i + 1}</div>
                        ))}
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden px-4 py-5 font-mono text-[11px] leading-7 sm:px-5 sm:text-xs">
                        <div>
                            <span className="text-violet-300">
                                #include
                            </span>{" "}
                            <span className="text-emerald-300">
                                {"<stdio.h>"}
                            </span>
                        </div>

                        <div className="mt-3">
                            <span className="text-violet-300">int</span>{" "}
                            <span className="text-sky-300">main</span>
                            <span className="text-zinc-400">()</span>{" "}
                            <span className="text-zinc-400">{"{"}</span>
                        </div>

                        <div className="pl-4">
                            <span className="text-violet-300">int</span>{" "}
                            <span className="text-sky-200">number</span>{" "}
                            <span className="text-zinc-400">=</span>{" "}
                            <span className="text-amber-200">42</span>
                            <span className="text-zinc-400">;</span>
                        </div>

                        <div className="pl-4">
                            <span className="text-sky-300">printf</span>
                            <span className="text-zinc-400">(</span>
                            <span className="text-emerald-300">
                                "Number: %d\n"
                            </span>
                            <span className="text-zinc-400">, </span>
                            <span className="text-sky-200">number</span>
                            <span className="text-zinc-400">);</span>
                        </div>

                        <div className="pl-4">
                            <span className="text-violet-300">
                                return
                            </span>{" "}
                            <span className="text-amber-200">0</span>
                            <span className="text-zinc-400">;</span>
                        </div>

                        <div className="text-zinc-400">{"}"}</div>
                    </div>
                </div>

                <div className="border-t border-white/[0.07] bg-[#0b0b11] px-4 py-3.5 sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Terminal
                                size={15}
                                className="text-violet-300"
                            />
                            <span>AI code insights</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-emerald-300">
                            <Sparkles size={13} />
                            Understand your code
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute -bottom-5 -left-2 hidden items-center gap-3 rounded-xl border border-white/[0.10] bg-[#17151f] px-4 py-3 shadow-xl sm:flex md:-left-8">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                    <Check size={18} />
                </div>

                <div>
                    <p className="text-xs font-semibold text-zinc-100">
                        Code discovered
                    </p>

                    <p className="mt-1 text-[11px] text-zinc-500">
                        Ready to explore
                    </p>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon: Icon, children }) {
    return (
        <div className="flex items-center gap-2.5 text-sm text-zinc-400">
            <Icon
                size={16}
                aria-hidden="true"
                className="shrink-0 text-violet-300"
            />
            <span>{children}</span>
        </div>
    );
}

export default function RepositoryAnalyzer({ onAnalyzed }) {
    const [repositoryUrl, setRepositoryUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const value = repositoryUrl.trim();
        let parsedUrl;

        try {
            parsedUrl = new URL(value);
        } catch {
            setError("Enter a valid GitHub repository URL.");
            return;
        }

        if (
            parsedUrl.protocol !== "https:" ||
            parsedUrl.hostname.toLowerCase() !== "github.com" ||
            parsedUrl.username ||
            parsedUrl.password ||
            parsedUrl.port
        ) {
            setError(
                "Use a public GitHub URL starting with https://github.com/"
            );
            return;
        }

        const segments = parsedUrl.pathname.split("/").filter(Boolean);

        if (
            segments.length !== 2 ||
            segments.some(
                (segment) =>
                    segment === "." ||
                    segment === ".." ||
                    segment.includes("\\")
            )
        ) {
            setError(
                "Enter a repository URL in the format github.com/owner/repository."
            );
            return;
        }

        try {
            setLoading(true);
            setResult(null);

            const data = await analyzeRepository(value);

            setResult(data);
            onAnalyzed?.(data);
        } catch (err) {
            setError(
                err?.message || "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative isolate min-h-screen overflow-hidden bg-[#09090f] text-zinc-100">
            {/* Background */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
            >
                <div className="absolute -top-64 left-1/2 h-[520px] w-[760px] max-w-[120vw] -translate-x-1/2 rounded-full bg-violet-700/[0.13] blur-[150px]" />

                <div className="absolute right-[-220px] top-[500px] h-[400px] w-[400px] rounded-full bg-violet-500/[0.05] blur-[140px]" />

                <div className="absolute bottom-[-250px] left-[-180px] h-[400px] w-[400px] rounded-full bg-emerald-500/[0.04] blur-[140px]" />
            </div>

            <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 xl:px-14">
                {/* Navigation */}
                <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-white/[0.07]">
                    <a
                        href="/"
                        aria-label="RepoRunner home"
                        className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/[0.12] text-violet-300 shadow-lg shadow-violet-950/20">
                            <FileCode2 size={22} />
                        </div>

                        <div className="min-w-0">
                            <p className="text-base font-bold tracking-tight text-white sm:text-lg">
                                RepoRunner
                            </p>

                            <p className="hidden text-xs text-zinc-200 sm:block">
                                Your AI-powered code workspace
                            </p>
                        </div>
                    </a>

                    <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-2">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                        </span>

                        <span className="text-xs font-medium text-emerald-300">
                            Workspace
                        </span>
                    </div>
                </header>

                {/* Hero */}
                <section className="grid items-center gap-12 pb-12 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-20 lg:pt-20">
                    <div className="min-w-0">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3.5 py-2 text-xs font-medium text-violet-200 sm:text-sm">
                            <Sparkles size={15} />
                            Your code. Your curiosity. Your workspace.
                        </div>

                        <h1 className="max-w-2xl text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl md:text-6xl">
                            Explore any repo.
                            <span className="mt-2 block bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-200 bg-clip-text pb-1 text-transparent">
                                Understand every line.
                            </span>
                        </h1>

                        <p className="mt-6 max-w-xl text-sm leading-7 text-zinc-200 sm:text-base sm:leading-8">
                            Bring your GitHub code into one workspace. Discover
                            source files, explore programs, provide input, and
                            understand expected outputs with AI-assisted insights.
                        </p>

                        <div className="mt-7 grid gap-3 sm:grid-cols-2">
                            <FeatureItem icon={GitBranch}>
                                Explore public repositories
                            </FeatureItem>

                            <FeatureItem icon={FolderGit2}>
                                Discover source files
                            </FeatureItem>

                            <FeatureItem icon={Sparkles}>
                                Understand code with AI
                            </FeatureItem>

                            <FeatureItem icon={ShieldCheck}>
                                No GitHub sign-in required
                            </FeatureItem>
                        </div>
                    </div>

                    <div className="min-w-0 px-1 pb-4 pt-2 sm:px-5 lg:px-0 lg:py-8">
                        <HeroCodePreview />
                    </div>
                </section>

                {/* Repository form */}
                <section
                    id="connect-repository"
                    className="mx-auto w-full max-w-5xl scroll-mt-8"
                >
                    <div className="overflow-hidden rounded-2xl border border-white/[0.10] bg-[#111118]/95 shadow-2xl shadow-black/20 backdrop-blur-xl sm:rounded-3xl">
                        <div className="border-b border-white/[0.07] px-5 py-5 sm:px-8 sm:py-6">
                            <div className="flex items-start gap-3.5">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.08] text-violet-300">
                                    <FolderGit2 size={21} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h2 className="text-base font-semibold text-white sm:text-lg">
                                        Start with a repository
                                    </h2>

                                    <p className="mt-1 text-xs leading-5 text-zinc-200 sm:text-sm">
                                        Paste a public GitHub URL and let
                                        RepoRunner discover your programs.
                                    </p>
                                </div>

                                <div className="hidden items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-zinc-200 sm:flex">
                                    <LockKeyhole size={12} />
                                    Public repos
                                </div>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            aria-busy={loading}
                            className="p-5 sm:p-8"
                        >
                            <label
                                htmlFor="repository-url"
                                className="mb-2.5 block text-sm font-medium text-zinc-200"
                            >
                                GitHub repository URL
                            </label>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="flex min-h-13 min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/[0.10] bg-[#09090f] px-3.5 transition duration-200 focus-within:border-violet-400/60 focus-within:ring-4 focus-within:ring-violet-500/[0.08] sm:px-4">
                                    <GitBranch
                                        size={19}
                                        aria-hidden="true"
                                        className="shrink-0 text-zinc-500"
                                    />

                                    <input
                                        id="repository-url"
                                        name="repositoryUrl"
                                        type="url"
                                        autoComplete="url"
                                        spellCheck={false}
                                        value={repositoryUrl}
                                        onChange={(event) => {
                                            setRepositoryUrl(
                                                event.target.value
                                            );

                                            if (error) setError("");
                                        }}
                                        placeholder="https://github.com/owner/repository"
                                        disabled={loading}
                                        aria-invalid={Boolean(error)}
                                        aria-describedby={
                                            error
                                                ? "repository-error"
                                                : "repository-hint"
                                        }
                                        className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600 disabled:opacity-60 sm:text-base"
                                    />

                                    {repositoryUrl && !loading && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRepositoryUrl("");
                                                setError("");
                                            }}
                                            aria-label="Clear repository URL"
                                            className="shrink-0 rounded-md p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        loading || !repositoryUrl.trim()
                                    }
                                    className="group inline-flex min-h-13 shrink-0 items-center justify-center gap-2.5 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition duration-200 hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111118] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[205px]"
                                >
                                    {loading ? (
                                        <>
                                            <LoaderCircle
                                                size={18}
                                                className="animate-spin"
                                            />
                                            Analyzing repository
                                        </>
                                    ) : (
                                        <>
                                            <Search size={18} />
                                            Analyze repository
                                            <ArrowRight
                                                size={16}
                                                className="transition-transform group-hover:translate-x-0.5"
                                            />
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="mt-3 flex flex-col gap-1.5 text-xs text-zinc-200 sm:flex-row sm:items-center sm:justify-between">
                                <p id="repository-hint">
                                    Example: github.com/owner/repository
                                </p>

                                <p className="flex items-center gap-1.5">
                                    <CircleDot
                                        size={12}
                                        className="text-emerald-400"
                                    />
                                    No GitHub account required
                                </p>
                            </div>

                            {error && (
                                <div
                                    id="repository-error"
                                    role="alert"
                                    className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm leading-6 text-red-300"
                                >
                                    <div className="mt-0.5 shrink-0">
                                        <X size={17} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium">
                                            Unable to analyze repository
                                        </p>

                                        <p className="mt-1 text-red-200/80">
                                            {error}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Results and loading */}
                    {loading && <AnalysisSkeleton />}

                    {result && !loading && (
                        <RepositoryAnalyzerResults result={result} />
                    )}
                </section>

                {/* Footer */}
                <footer className="mt-16 border-t border-white/[0.07] py-7 sm:mt-20">
                    <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
                            <FileCode2
                                size={17}
                                className="text-violet-300"
                            />
                            RepoRunner
                        </div>

                        <p className="text-xs leading-5 text-zinc-300">
                            Built for students who want to understand code,
                            not just read it.
                        </p>
                    </div>
                </footer>
            </div>
        </main>
    );
}
