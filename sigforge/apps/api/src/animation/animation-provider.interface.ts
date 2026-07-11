import type { AnimationPreset } from "@sigforge/shared";

export interface AnimateInput {
  sourceStaticPng: Buffer;
  preset: AnimationPreset;
  brandColorHex: string;
  width: number;
  height: number;
}

export interface AnimateOutput {
  gif: Buffer;
  frames: number;
  mimeType: "image/gif";
}

export interface AnimationProvider {
  readonly name: string;
  animate(input: AnimateInput): Promise<AnimateOutput>;
}

export const ANIMATION_PROVIDER = Symbol("ANIMATION_PROVIDER");
