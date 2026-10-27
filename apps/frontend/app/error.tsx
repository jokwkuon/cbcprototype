"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-bold">Unable to load this page</h1><p className="my-4">Check your access and demo database setup, then try again. No missing data has been reported as zero.</p><button onClick={reset}>Try again</button><a className="ml-5" href="/dashboard">Dashboard</a></main>;
}
