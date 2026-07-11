import { z } from "zod";

export const TemplateKey = z.enum(["classic", "modern", "minimal"]);
export type TemplateKey = z.infer<typeof TemplateKey>;

export const IconKey = z.enum([
  "linkedin",
  "twitter",
  "github",
  "instagram",
  "website",
  "email",
  "phone",
  "calendar",
]);
export type IconKey = z.infer<typeof IconKey>;

export const IconLink = z.object({
  icon: IconKey,
  url: z.string().url(),
  label: z.string().max(60).optional(),
});
export type IconLink = z.infer<typeof IconLink>;

export const AnimationPreset = z.enum(["none", "fade-loop", "pulse"]);
export type AnimationPreset = z.infer<typeof AnimationPreset>;

export const SignatureFields = z.object({
  fullName: z.string().min(1).max(120),
  jobTitle: z.string().max(120).default(""),
  company: z.string().max(120).default(""),
  phone: z.string().max(40).default(""),
  email: z.string().email().or(z.literal("")).default(""),
  website: z.string().url().or(z.literal("")).default(""),
  address: z.string().max(200).default(""),
  tagline: z.string().max(160).default(""),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "brandColor must be a 6-digit hex")
    .default("#0F62FE"),
  logoAssetKey: z.string().max(120).default(""),
  photoAssetKey: z.string().max(120).default(""),
  animation: AnimationPreset.default("none"),
  iconLinks: z.array(IconLink).max(8).default([]),
});
export type SignatureFields = z.infer<typeof SignatureFields>;

export const CreateSignatureInput = z.object({
  name: z.string().min(1).max(120),
  template: TemplateKey,
  fields: SignatureFields,
});
export type CreateSignatureInput = z.infer<typeof CreateSignatureInput>;

export const UpdateSignatureInput = CreateSignatureInput.partial();
export type UpdateSignatureInput = z.infer<typeof UpdateSignatureInput>;

export const SignatureDto = z.object({
  id: z.string(),
  orgId: z.string(),
  createdById: z.string(),
  name: z.string(),
  template: TemplateKey,
  fields: SignatureFields,
  publicSlug: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SignatureDto = z.infer<typeof SignatureDto>;
