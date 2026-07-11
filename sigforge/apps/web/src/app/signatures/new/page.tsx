"use client";
import { useRouter } from "next/navigation";
import { SignatureEditor } from "@/components/SignatureEditor";
import { apiFetch } from "@/lib/api-client";
import type { SignatureDto, SignatureFields, TemplateKey } from "@sigforge/shared";

const emptyFields: SignatureFields = {
  fullName: "",
  jobTitle: "",
  company: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  tagline: "",
  brandColor: "#0F62FE",
  logoAssetKey: "",
  photoAssetKey: "",
  animation: "none",
  iconLinks: [],
};

export default function NewSignaturePage() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">New signature</h1>
      <div className="mt-8">
        <SignatureEditor
          initialName="Untitled signature"
          initialTemplate={"classic" as TemplateKey}
          initialFields={emptyFields}
          submitLabel="Create signature"
          onSubmit={async (name, template, fields) => {
            const sig = await apiFetch<SignatureDto>("/signatures", {
              method: "POST",
              body: JSON.stringify({ name, template, fields }),
            });
            router.push(`/signatures/${sig.id}/install`);
          }}
        />
      </div>
    </main>
  );
}
