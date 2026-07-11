import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import argon2 from "argon2";
import { nanoid } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { DeployToTeamInput, InviteMemberInput, SignatureFields } from "@sigforge/shared";

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(private readonly prisma: PrismaService) {}

  async invite(orgId: string, actorId: string, input: InviteMemberInput) {
    await this.assertOwnerOrAdmin(orgId, actorId);
    const existingUser = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) {
      const existingMembership = await this.prisma.membership.findFirst({
        where: { orgId, userId: existingUser.id },
      });
      if (existingMembership) return { status: "already-member" as const };
      await this.prisma.membership.create({
        data: { orgId, userId: existingUser.id, role: input.role },
      });
      return { status: "added-existing" as const };
    }

    // TODO: SMTP email invite. For now: create a shadow user with a random password.
    const tempPassword = nanoid(16);
    const passwordHash = await argon2.hash(tempPassword);
    const user = await this.prisma.user.create({
      data: { email: input.email, passwordHash, name: input.email.split("@")[0] },
    });
    await this.prisma.membership.create({
      data: { orgId, userId: user.id, role: input.role },
    });
    this.logger.warn(`[stub-invite] user=${input.email} tempPassword=${tempPassword}`);
    return { status: "created-stub" as const, tempPassword };
  }

  async deploy(orgId: string, actorId: string, input: DeployToTeamInput) {
    await this.assertOwnerOrAdmin(orgId, actorId);
    const source = await this.prisma.signature.findFirst({
      where: { id: input.signatureId, orgId },
    });
    if (!source) throw new NotFoundException("Signature not found");
    const members = await this.prisma.membership.findMany({
      where: { orgId },
      include: { user: true },
    });
    const overridesByUser = new Map(
      input.memberOverrides.map((o) => [o.userId, o.fields]),
    );

    const created: string[] = [];
    for (const m of members) {
      const overrides = overridesByUser.get(m.userId) ?? {};
      const merged: SignatureFields = {
        ...(source.fieldsJson as SignatureFields),
        ...overrides,
      } as SignatureFields;
      const sig = await this.prisma.signature.create({
        data: {
          orgId,
          createdById: m.userId,
          name: `${source.name} — ${m.user.name}`,
          template: source.template,
          publicSlug: nanoid(12),
          fieldsJson: merged,
        },
      });
      created.push(sig.id);
    }
    return { deployed: created.length, ids: created };
  }

  private async assertOwnerOrAdmin(orgId: string, userId: string) {
    const m = await this.prisma.membership.findFirst({ where: { orgId, userId } });
    if (!m) throw new NotFoundException();
    if (m.role === "MEMBER") throw new ForbiddenException("Only OWNER/ADMIN can perform this");
  }
}
