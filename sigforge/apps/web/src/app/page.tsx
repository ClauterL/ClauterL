import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-24">
      <h1 className="text-5xl font-semibold tracking-tight">SigForge</h1>
      <p className="mt-4 max-w-2xl text-lg text-neutral-600">
        Animated, interactive email signatures without breaking deliverability. Animations are
        served from your own domain as lightweight GIFs — no JavaScript, no external CSS, and
        real impression + click analytics.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/register"
          className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
