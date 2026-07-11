import { TrackingService } from "./tracking.service";

type Row = { createdAt: Date };

interface FakeDb {
  signatures: Map<string, { id: string }>;
  links: Map<string, { id: string; signatureId: string; targetUrl: string; key: string }>;
  impressions: { signatureId: string; createdAt: Date; ipHash: string | null; userAgent: string | null }[];
  clicks: { signatureId: string; trackedLinkId: string; createdAt: Date }[];
}

function makePrismaFake(db: FakeDb) {
  return {
    signature: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        db.signatures.get(where.id) ?? null,
    },
    trackedLink: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        db.links.get(where.id) ?? null,
    },
    impressionEvent: {
      create: async ({ data }: { data: { signatureId: string; ipHash: string | null; userAgent: string | null } }) => {
        db.impressions.push({ ...data, createdAt: new Date() });
        return { id: "imp" };
      },
      count: async ({ where }: { where: { signatureId: string; createdAt: { gte: Date } } }) =>
        db.impressions.filter(
          (i) => i.signatureId === where.signatureId && i.createdAt >= where.createdAt.gte,
        ).length,
      findMany: async ({ where }: { where: { signatureId: string; createdAt: { gte: Date } } }): Promise<Row[]> =>
        db.impressions
          .filter(
            (i) => i.signatureId === where.signatureId && i.createdAt >= where.createdAt.gte,
          )
          .map((i) => ({ createdAt: i.createdAt })),
    },
    clickEvent: {
      create: async ({ data }: { data: { signatureId: string; trackedLinkId: string } }) => {
        db.clicks.push({ ...data, createdAt: new Date() });
        return { id: "click" };
      },
      count: async ({ where }: { where: { signatureId: string; createdAt: { gte: Date } } }) =>
        db.clicks.filter(
          (c) => c.signatureId === where.signatureId && c.createdAt >= where.createdAt.gte,
        ).length,
      groupBy: async () => [],
      findMany: async ({ where }: { where: { signatureId: string; createdAt: { gte: Date } } }): Promise<Row[]> =>
        db.clicks
          .filter(
            (c) => c.signatureId === where.signatureId && c.createdAt >= where.createdAt.gte,
          )
          .map((c) => ({ createdAt: c.createdAt })),
    },
  };
}

describe("TrackingService", () => {
  let db: FakeDb;
  let service: TrackingService;

  beforeEach(() => {
    db = {
      signatures: new Map([["sig1", { id: "sig1" }]]),
      links: new Map([
        ["link1", { id: "link1", signatureId: "sig1", targetUrl: "https://example.com", key: "website" }],
      ]),
      impressions: [],
      clicks: [],
    };
    service = new TrackingService(makePrismaFake(db) as never);
  });

  test("pixelBytes returns a 1x1 transparent GIF", () => {
    const pixel = service.pixelBytes;
    // GIF89a header
    expect(pixel.slice(0, 6).toString("ascii")).toBe("GIF89a");
    expect(pixel.byteLength).toBeLessThan(100);
  });

  test("recordImpression writes with hashed IP and truncated UA", async () => {
    await service.recordImpression("sig1", "192.0.2.1", "curl/8.0");
    expect(db.impressions).toHaveLength(1);
    expect(db.impressions[0].ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(db.impressions[0].userAgent).toBe("curl/8.0");
  });

  test("recordImpression ignores unknown signature ids", async () => {
    await service.recordImpression("does-not-exist", "1.2.3.4", "ua");
    expect(db.impressions).toHaveLength(0);
  });

  test("resolveClick returns the target url and records the click", async () => {
    const url = await service.resolveClick("link1", "1.2.3.4", "ua");
    expect(url).toBe("https://example.com");
    expect(db.clicks).toHaveLength(1);
    expect(db.clicks[0].signatureId).toBe("sig1");
  });

  test("resolveClick returns null for missing link", async () => {
    const url = await service.resolveClick("nope", undefined, undefined);
    expect(url).toBeNull();
    expect(db.clicks).toHaveLength(0);
  });

  test("summary counts impressions and clicks in the last 30 days", async () => {
    await service.recordImpression("sig1", "1.1.1.1", "ua");
    await service.recordImpression("sig1", "1.1.1.1", "ua");
    await service.resolveClick("link1", "1.1.1.1", "ua");
    const s = await service.summary("sig1");
    expect(s.impressions).toBe(2);
    expect(s.clicks).toBe(1);
  });

  test("dailyChart returns 30 buckets", async () => {
    const chart = await service.dailyChart("sig1");
    expect(chart).toHaveLength(30);
    for (const bucket of chart) {
      expect(bucket).toHaveProperty("date");
      expect(bucket).toHaveProperty("impressions");
      expect(bucket).toHaveProperty("clicks");
    }
  });
});
