
import { Link } from "react-router-dom";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090f] px-4 text-zinc-100">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
          <FileQuestion size={30} />
        </div>

        <p className="mt-6 text-sm font-medium text-violet-300">404 ERROR</p>
        <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          This page doesn't exist or may have moved.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <ArrowLeft size={17} />
          Back to RepoRunner
        </Link>
      </div>
    </main>
  );
}
