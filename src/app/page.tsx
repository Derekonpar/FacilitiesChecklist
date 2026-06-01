import Link from "next/link";
import { VENUE_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Facilities
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          {VENUE_NAME}
        </h1>
        <p className="mt-3 max-w-sm text-zinc-600">
          Report maintenance issues by department or manage the queue as a
          manager.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/submit"
          className="rounded-xl bg-zinc-900 px-6 py-4 text-center text-base font-medium text-white transition hover:bg-zinc-800"
        >
          Report an issue
        </Link>
        <Link
          href="/lead"
          className="rounded-xl border border-zinc-300 bg-white px-6 py-4 text-center text-base font-medium text-zinc-900 transition hover:bg-zinc-50"
        >
          Manager inbox (list & calendar)
        </Link>
      </div>
    </main>
  );
}
