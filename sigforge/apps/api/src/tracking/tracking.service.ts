import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  get pixelBytes(): Buffer {
    return TRANSPARENT_GIF;
  }

  async recordImpression(signatureId: string, ip: string | undefined, ua: string | undefined) {
    const sig = await this.prisma.signature.findUnique({ where: { id: signatureId } });
    if (!sig) return;
    await this.prisma.impressionEvent.create({
      data: {
        signatureId,
        ipHash: ip ? sha256(ip) : null,
        userAgent: ua?.slice(0, 500) ?? null,
      },
    });
  }

  async resolveClick(
    linkId: string,
    ip: string | undefined,
    ua: string | undefined,
  ): Promise<string | null> {
    const link = await this.prisma.trackedLink.findUnique({ where: { id: linkId } });
    if (!link) return null;
    await this.prisma.clickEvent.create({
      data: {
        signatureId: link.signatureId,
        trackedLinkId: link.id,
        ipHash: ip ? sha256(ip) : null,
        userAgent: ua?.slice(0, 500) ?? null,
      },
    });
    return link.targetUrl;
  }

  async summary(signatureId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const [impressions, clicks, perLink] = await Promise.all([
      this.prisma.impressionEvent.count({ where: { signatureId, createdAt: { gte: since } } }),
      this.prisma.clickEvent.count({ where: { signatureId, createdAt: { gte: since } } }),
      this.prisma.clickEvent.groupBy({
        by: ["trackedLinkId"],
        where: { signatureId, createdAt: { gte: since } },
        _count: { trackedLinkId: true },
      }),
    ]);
    return { impressions, clicks, perLink };
  }

  async dailyChart(signatureId: string): Promise<{ date: string; impressions: number; clicks: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    since.setHours(0, 0, 0, 0);

    const [imps, clicks] = await Promise.all([
      this.prisma.impressionEvent.findMany({
        where: { signatureId, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.clickEvent.findMany({
        where: { signatureId, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);
    const buckets = new Map<string, { impressions: number; clicks: number }>();
    for (let d = 0; d < 30; d++) {
      const day = new Date(since);
      day.setDate(day.getDate() + d);
      buckets.set(day.toISOString().slice(0, 10), { impressions: 0, clicks: 0 });
    }
    for (const e of imps) {
      const k = e.createdAt.toISOString().slice(0, 10);
      const b = buckets.get(k);
      if (b) b.impressions++;
    }
    for (const e of clicks) {
      const k = e.createdAt.toISOString().slice(0, 10);
      const b = buckets.get(k);
      if (b) b.clicks++;
    }
    return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
  }
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
