import { Injectable, NotFoundException } from "@nestjs/common";
import { nanoid } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateSignatureInput,
  UpdateSignatureInput,
  SignatureFields,
  TemplateKey,
} from "@sigforge/shared";
import { renderSignatureHtml, RenderContext } from "./signature-html.generator";

const TRACKED_KEYS = ["phone", "email", "website"] as const;

@Injectable()
export class SignatureService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, userId: string, input: CreateSignatureInput) {
    const publicSlug = nanoid(12);
    const sig = await this.prisma.signature.create({
      data: {
        orgId,
        createdById: userId,
        name: input.name,
        template: input.template,
        publicSlug,
        fieldsJson: input.fields,
      },
    });
    await this.syncTrackedLinks(sig.id, input.fields);
    return sig;
  }

  async update(orgId: string, id: string, input: UpdateSignatureInput) {
    const existing = await this.prisma.signature.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException();
    const merged = { ...(existing.fieldsJson as SignatureFields), ...(input.fields ?? {}) };
    const updated = await this.prisma.signature.update({
      where: { id },
      data: {
        name: input.name ?? existing.name,
        template: input.template ?? existing.template,
        fieldsJson: merged,
      },
    });
    await this.syncTrackedLinks(id, merged);
    return updated;
  }

  async duplicate(orgId: string, id: string, userId: string) {
    const existing = await this.prisma.signature.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException();
    return this.create(orgId, userId, {
      name: `${existing.name} (copy)`,
      template: existing.template as TemplateKey,
      fields: existing.fieldsJson as SignatureFields,
    });
  }

  async remove(orgId: string, id: string) {
    const existing = await this.prisma.signature.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException();
    await this.prisma.signature.delete({ where: { id } });
  }

  list(orgId: string) {
    return this.prisma.signature.findMany({
      where: { orgId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findOne(orgId: string, id: string) {
    const sig = await this.prisma.signature.findFirst({ where: { id, orgId } });
    if (!sig) throw new NotFoundException();
    return sig;
  }

  async renderHtml(orgId: string, id: string, assetBaseUrl: string): Promise<string> {
    const sig = await this.findOne(orgId, id);
    const trackedLinks = await this.prisma.trackedLink.findMany({
      where: { signatureId: id },
    });
    const map: Record<string, string> = {};
    for (const link of trackedLinks) map[link.key] = link.id;
    const ctx: RenderContext = {
      signatureId: sig.id,
      publicSlug: sig.publicSlug,
      assetBaseUrl,
      fields: sig.fieldsJson as SignatureFields,
      template: sig.template as TemplateKey,
      trackedLinks: map,
    };
    return renderSignatureHtml(ctx);
  }

  private async syncTrackedLinks(signatureId: string, fields: SignatureFields) {
    const desired: { key: string; targetUrl: string }[] = [];
    if (fields.phone) desired.push({ key: "phone", targetUrl: `tel:${fields.phone}` });
    if (fields.email) desired.push({ key: "email", targetUrl: `mailto:${fields.email}` });
    if (fields.website) desired.push({ key: "website", targetUrl: fields.website });
    for (let i = 0; i < fields.iconLinks.length; i++) {
      desired.push({ key: `icon-${i}`, targetUrl: fields.iconLinks[i].url });
    }
    const existing = await this.prisma.trackedLink.findMany({ where: { signatureId } });
    const existingByKey = new Map(existing.map((l) => [l.key, l]));

    for (const link of desired) {
      const current = existingByKey.get(link.key);
      if (!current) {
        await this.prisma.trackedLink.create({
          data: { signatureId, key: link.key, targetUrl: link.targetUrl },
        });
      } else if (current.targetUrl !== link.targetUrl) {
        await this.prisma.trackedLink.update({
          where: { id: current.id },
          data: { targetUrl: link.targetUrl },
        });
      }
    }
    const desiredKeys = new Set(desired.map((d) => d.key));
    const orphans = existing.filter((l) => !desiredKeys.has(l.key));
    if (orphans.length) {
      await this.prisma.trackedLink.deleteMany({
        where: { id: { in: orphans.map((o) => o.id) } },
      });
    }
    void TRACKED_KEYS;
  }
}
