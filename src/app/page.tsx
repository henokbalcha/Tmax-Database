export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <div className="max-w-xl space-y-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 shadow-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">
          Retail Management System
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          This app orchestrates a linear supply chain across Procurement,
          Manufacturing, Distribution, Retail, and POS using Supabase.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-black transition hover:bg-[var(--color-accent-soft)]"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
