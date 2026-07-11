"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, clearTokens } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import type { SignatureDto } from "@sigforge/shared";

export default function DashboardPage() {
  const [signatures, setSignatures] = useState<SignatureDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<SignatureDto[]>("/signatures")
      .then(setSignatures)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your signatures</h1>
        <div className="flex gap-2">
          <Link href="/signatures/new">
            <Button>New signature</Button>
          </Link>
          <Button
            variant="ghost"
            onClick={() => {
              clearTokens();
              window.location.href = "/login";
            }}
          >
            Log out
          </Button>
        </div>
      </header>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      <ul className="mt-8 divide-y rounded-lg border bg-white">
        {(signatures ?? []).map((s) => (
          <li key={s.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-neutral-500">
                {s.template} · updated {new Date(s.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/signatures/${s.id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
              <Link href={`/signatures/${s.id}/install`}>
                <Button variant="secondary">Install</Button>
              </Link>
              <Link href={`/signatures/${s.id}/analytics`}>
                <Button variant="ghost">Analytics</Button>
              </Link>
            </div>
          </li>
        ))}
        {signatures && signatures.length === 0 && (
          <li className="px-4 py-6 text-sm text-neutral-500">
            No signatures yet. Create your first one.
          </li>
        )}
      </ul>
    </main>
  );
}
