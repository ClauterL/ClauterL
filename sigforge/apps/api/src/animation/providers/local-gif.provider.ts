import { Injectable, Logger } from "@nestjs/common";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import sharp from "sharp";
import type {
  AnimationProvider,
  AnimateInput,
  AnimateOutput,
} from "../animation-provider.interface";

@Injectable()
export class LocalGifProvider implements AnimationProvider {
  readonly name = "local";
  private readonly logger = new Logger(LocalGifProvider.name);

  async animate(input: AnimateInput): Promise<AnimateOutput> {
    const { sourceStaticPng, preset, width, height } = input;
    const frameCount = 12;
    const delay = 100;

    const gif = GIFEncoder();
    const base = await sharp(sourceStaticPng).resize(width, height).ensureAlpha().raw().toBuffer();

    for (let i = 0; i < frameCount; i++) {
      const t = i / frameCount;
      const frame = this.buildFrame(base, width, height, preset, t);
      const palette = quantize(frame, 256, { format: "rgba4444" });
      const indexed = applyPalette(frame, palette, "rgba4444");
      gif.writeFrame(indexed, width, height, { palette, delay });
    }
    gif.finish();
    const bytes = gif.bytes();
    this.logger.debug(`Encoded ${frameCount}f gif (${bytes.byteLength} bytes) preset=${preset}`);
    return {
      gif: Buffer.from(bytes),
      frames: frameCount,
      mimeType: "image/gif",
    };
  }

  private buildFrame(
    base: Buffer,
    width: number,
    height: number,
    preset: string,
    t: number,
  ): Uint8ClampedArray {
    const out = new Uint8ClampedArray(base.length);
    let alpha = 1;
    let scale = 1;

    if (preset === "fade-loop") {
      alpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
    } else if (preset === "pulse") {
      scale = 0.94 + 0.06 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
    }

    if (scale === 1) {
      for (let i = 0; i < base.length; i += 4) {
        out[i] = base[i];
        out[i + 1] = base[i + 1];
        out[i + 2] = base[i + 2];
        out[i + 3] = Math.round(base[i + 3] * alpha);
      }
      return out;
    }

    const cx = width / 2;
    const cy = height / 2;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcX = Math.round(cx + (x - cx) / scale);
        const srcY = Math.round(cy + (y - cy) / scale);
        const dstIdx = (y * width + x) * 4;
        if (srcX < 0 || srcX >= width || srcY < 0 || srcY >= height) {
          out[dstIdx + 3] = 0;
          continue;
        }
        const srcIdx = (srcY * width + srcX) * 4;
        out[dstIdx] = base[srcIdx];
        out[dstIdx + 1] = base[srcIdx + 1];
        out[dstIdx + 2] = base[srcIdx + 2];
        out[dstIdx + 3] = Math.round(base[srcIdx + 3] * alpha);
      }
    }
    return out;
  }
}
