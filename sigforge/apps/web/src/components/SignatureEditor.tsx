"use client";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { SignatureFields, TemplateKey } from "@sigforge/shared";

interface Props {
  initialName: string;
  initialTemplate: TemplateKey;
  initialFields: SignatureFields;
  onSubmit: (name: string, template: TemplateKey, fields: SignatureFields) => Promise<void>;
  submitLabel: string;
}

const TEMPLATES: TemplateKey[] = ["classic", "modern", "minimal"];

export function SignatureEditor(props: Props) {
  const [name, setName] = useState(props.initialName);
  const [template, setTemplate] = useState<TemplateKey>(props.initialTemplate);
  const [fields, setFields] = useState<SignatureFields>(props.initialFields);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set =
    <K extends keyof SignatureFields>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((f) => ({ ...f, [k]: e.target.value } as SignatureFields));

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await props.onSubmit(name, template, fields);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <label className="text-sm text-neutral-600">Signature name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />

        <label className="text-sm text-neutral-600">Template</label>
        <div className="flex gap-2">
          {TEMPLATES.map((t) => (
            <Button
              key={t}
              variant={template === t ? "primary" : "secondary"}
              onClick={() => setTemplate(t)}
              type="button"
            >
              {t}
            </Button>
          ))}
        </div>

        <hr />
        <label className="text-sm text-neutral-600">Full name</label>
        <Input value={fields.fullName} onChange={set("fullName")} />
        <label className="text-sm text-neutral-600">Job title</label>
        <Input value={fields.jobTitle} onChange={set("jobTitle")} />
        <label className="text-sm text-neutral-600">Company</label>
        <Input value={fields.company} onChange={set("company")} />
        <label className="text-sm text-neutral-600">Phone</label>
        <Input value={fields.phone} onChange={set("phone")} />
        <label className="text-sm text-neutral-600">Email</label>
        <Input value={fields.email} onChange={set("email")} />
        <label className="text-sm text-neutral-600">Website</label>
        <Input value={fields.website} onChange={set("website")} />
        <label className="text-sm text-neutral-600">Brand color</label>
        <Input
          value={fields.brandColor}
          onChange={set("brandColor")}
          placeholder="#0F62FE"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={submit} disabled={saving} className="w-full">
          {saving ? "Saving…" : props.submitLabel}
        </Button>
      </div>

      <div>
        <p className="text-sm text-neutral-600">Preview (approximate)</p>
        <div className="mt-2 rounded-lg border bg-white p-4">
          <p className="font-semibold text-lg">{fields.fullName || "Your name"}</p>
          <p className="text-sm text-neutral-600">
            {fields.jobTitle}
            {fields.jobTitle && fields.company ? " · " : ""}
            <span style={{ color: fields.brandColor }}>{fields.company}</span>
          </p>
          <p className="text-xs text-neutral-500">{fields.email}</p>
          <p className="text-xs text-neutral-500">{fields.phone}</p>
          <p className="text-xs text-neutral-500">{fields.website}</p>
        </div>
        <p className="mt-4 text-xs text-neutral-500">
          The final HTML lives on the API and includes tracked links + a 1×1 pixel for
          impressions. See the install page after saving.
        </p>
      </div>
    </div>
  );
}
