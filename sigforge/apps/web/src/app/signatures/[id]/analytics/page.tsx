"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

interface Analytics {
  summary: { impressions: number; clicks: number };
  chart: { date: string; impressions: number; clicks: number }[];
}

export default function AnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    apiFetch<Analytics>(`/signatures/${params.id}/analytics`)
      .then(setData)
      .catch((e) => setError((e as Error).message));
  }, [params?.id]);

  const max = Math.max(1, ...(data?.chart.map((d) => d.impressions) ?? [1]));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">30-day analytics</h1>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {data && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-md border bg-white p-4">
              <p className="text-xs uppercase text-neutral-500">Impressions</p>
              <p className="text-3xl font-semibold">{data.summary.impressions}</p>
            </div>
            <div className="rounded-md border bg-white p-4">
              <p className="text-xs uppercase text-neutral-500">Clicks</p>
              <p className="text-3xl font-semibold">{data.summary.clicks}</p>
            </div>
          </div>

          <div className="mt-8 rounded-md border bg-white p-4">
            <p className="text-sm font-medium">Daily impressions</p>
            <div className="mt-3 flex h-40 items-end gap-1">
              {data.chart.map((d) => (
                <div key={d.date} className="flex flex-1 flex-col items-center">
                  <div
                    className="w-full rounded-t bg-brand"
                    style={{ height: `${(d.impressions / max) * 100}%` }}
                    title={`${d.date}: ${d.impressions} imp, ${d.clicks} clk`}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
