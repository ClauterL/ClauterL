"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SignatureEditor } from "@/components/SignatureEditor";
import { apiFetch } from "@/lib/api-client";
import type { SignatureDto, SignatureFields, TemplateKey } from "@sigforge/shared";

export default function EditSignaturePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [sig, setSig] = useState<SignatureDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    apiFetch<SignatureDto>(`/signatures/${params.id}`)
      .then(setSig)
      .catch((e) => setError((e as Error).message));
  }, [params?.id]);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!sig) return <p className="p-6">Loading…</p>;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Edit signature</h1>
      <div className="mt-8">
        <SignatureEditor
          initialName={sig.name}
          initialTemplate={sig.template as TemplateKey}
          initialFields={sig.fields as SignatureFields}
          submitLabel="Save changes"
          onSubmit={async (name, template, fields) => {
            await apiFetch(`/signatures/${sig.id}`, {
              method: "PATCH",
              body: JSON.stringify({ name, template, fields }),
            });
            router.push(`/signatures/${sig.id}/install`);
          }}
        />
      </div>
    </main>
  );
}
