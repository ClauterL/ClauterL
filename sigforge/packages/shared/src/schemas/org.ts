import { z } from "zod";

export const MembershipRole = z.enum(["OWNER", "ADMIN", "MEMBER"]);
export type MembershipRole = z.infer<typeof MembershipRole>;

export const InviteMemberInput = z.object({
  email: z.string().email(),
  role: MembershipRole.default("MEMBER"),
});
export type InviteMemberInput = z.infer<typeof InviteMemberInput>;

export const DeployToTeamInput = z.object({
  signatureId: z.string().cuid(),
  memberOverrides: z
    .array(
      z.object({
        userId: z.string().cuid(),
        fields: z.record(z.string()),
      }),
    )
    .default([]),
});
export type DeployToTeamInput = z.infer<typeof DeployToTeamInput>;
