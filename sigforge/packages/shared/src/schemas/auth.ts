import { z } from "zod";

export const RegisterInput = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
  orgName: z.string().min(1).max(120),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const RefreshInput = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof RefreshInput>;

export const TokenPair = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type TokenPair = z.infer<typeof TokenPair>;
