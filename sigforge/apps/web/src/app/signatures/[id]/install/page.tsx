"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, API_BASE, getTokens } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

export default function InstallPage() {
  const params = useParams<{ id: string }>();
  const [html, setHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    const tokens = getTokens();
    fetch(`${API_BASE}/signatures/${params.id}/html`, {
      headers: { authorization: `Bearer ${tokens.accessToken ?? ""}` },
    })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`API ${r.status}`))))
      .then(setHtml)
      .catch((e) => setError((e as Error).message));
  }, [params?.id]);

  const copy = async () => navigator.clipboard.writeText(html);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Install your signature</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Paste the HTML below into your email client's signature settings. The animation and
        icons are served from your SigForge domain — never embedded — so deliverability stays
        intact.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3">
        <div className="flex justify-between">
          <p className="text-sm font-medium">Signature HTML</p>
          <Button variant="secondary" onClick={copy}>
            Copy HTML
          </Button>
        </div>
        <pre className="max-h-72 overflow-auto rounded-md border bg-neutral-900 p-3 text-xs text-neutral-100">
          {html || "…"}
        </pre>

        <p className="text-sm font-medium">Preview</p>
        <div className="rounded-md border bg-white p-4" dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      <section className="mt-10 space-y-6 text-sm text-neutral-700">
        <div>
          <h2 className="font-semibold">Gmail</h2>
          <ol className="ml-4 list-decimal space-y-1">
            <li>Open Gmail → Settings (gear icon) → See all settings.</li>
            <li>Under General → Signature, click "Create new" and name it.</li>
            <li>Paste the copied HTML into the signature body (rich-text field).</li>
            <li>Set it as default for new mail and replies. Save.</li>
          </ol>
        </div>
        <div>
          <h2 className="font-semibold">Outlook</h2>
          <ol className="ml-4 list-decimal space-y-1">
            <li>File → Options → Mail → Signatures.</li>
            <li>Create a new signature and paste the HTML.</li>
            <li>Assign it to your account for New messages / Replies.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
