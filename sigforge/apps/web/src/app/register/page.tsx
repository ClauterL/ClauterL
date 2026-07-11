"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch, setTokens } from "@/lib/api-client";
import { TokenPair } from "@sigforge/shared";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", name: "", orgName: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tokens = await apiFetch<TokenPair>("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setTokens(tokens);
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold">Create your workspace</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input placeholder="Your name" value={form.name} onChange={set("name")} required />
        <Input placeholder="Workspace name" value={form.orgName} onChange={set("orgName")} required />
        <Input
          type="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={set("email")}
          required
        />
        <Input
          type="password"
          placeholder="password (min 8 chars)"
          value={form.password}
          onChange={set("password")}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating…" : "Create workspace"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-neutral-500">
        Have an account?{" "}
        <Link href="/login" className="text-brand">
          Log in
        </Link>
      </p>
    </main>
  );
}
