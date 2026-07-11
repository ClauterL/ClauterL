import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { PrismaService } from "../prisma/prisma.service";
import { AnimationService } from "../animation/animation.service";
import type { AnimationPreset } from "@sigforge/shared";

const STORAGE_DIR = () => process.env.STORAGE_DIR ?? "./storage";
const LOGO_W = 200;
const LOGO_H = 200;
const PHOTO_W = 200;
const PHOTO_H = 200;

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly animation: AnimationService,
  ) {}

  async putLogo(orgId: string, signatureId: string, raw: Buffer, preset: AnimationPreset) {
    const staticPng = await sharp(raw)
      .resize(LOGO_W, LOGO_H, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await this.writeAsset(orgId, signatureId, "logo-static.png", staticPng, "image/png", "LOGO_STATIC");

    if (preset !== "none") {
      const { gif } = await this.animation.animate({
        sourceStaticPng: staticPng,
        preset,
        brandColorHex: "#000000",
        width: LOGO_W,
        height: LOGO_H,
      });
      await this.writeAsset(
        orgId,
        signatureId,
        "logo-animated.gif",
        gif,
        "image/gif",
        "LOGO_ANIMATED",
      );
    }
  }

  async putPhoto(orgId: string, signatureId: string, raw: Buffer) {
    const png = await sharp(raw)
      .resize(PHOTO_W, PHOTO_H, { fit: "cover" })
      .png()
      .toBuffer();
    await this.writeAsset(orgId, signatureId, "photo.png", png, "image/png", "PHOTO");
  }

  async readAsset(
    signatureId: string,
    filename: string,
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const asset = await this.prisma.signatureAsset.findFirst({
      where: { signatureId, key: filename },
    });
    if (!asset) return null;
    try {
      const buffer = await fs.readFile(asset.path);
      return { buffer, mimeType: asset.mimeType };
    } catch (err) {
      this.logger.warn(`Missing asset file at ${asset.path}: ${(err as Error).message}`);
      return null;
    }
  }

  async getSignatureAndAsset(signatureId: string, filename: string) {
    const sig = await this.prisma.signature.findUnique({ where: { id: signatureId } });
    if (!sig) throw new NotFoundException();
    const asset = await this.readAsset(signatureId, filename);
    if (!asset) throw new NotFoundException();
    return { sig, asset };
  }

  private async writeAsset(
    orgId: string,
    signatureId: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
    kind: "LOGO_STATIC" | "LOGO_ANIMATED" | "PHOTO" | "ICON",
  ) {
    const dir = path.join(STORAGE_DIR(), orgId, signatureId);
    await fs.mkdir(dir, { recursive: true });
    const filepath = path.join(dir, filename);
    await fs.writeFile(filepath, buffer);
    await this.prisma.signatureAsset.upsert({
      where: { signatureId_key: { signatureId, key: filename } },
      update: { mimeType, bytes: buffer.byteLength, path: filepath, kind },
      create: {
        orgId,
        signatureId,
        key: filename,
        mimeType,
        bytes: buffer.byteLength,
        path: filepath,
        kind,
      },
    });
  }
}
