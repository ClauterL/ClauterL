import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterInput, LoginInput, TokenPair } from "@sigforge/shared";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<TokenPair & { orgId: string; userId: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException("Email already registered");

    const passwordHash = await argon2.hash(input.password);
    const slug = slugify(input.orgName);

    const { user, org, membership } = await this.prisma.$transaction(async (tx) => {
      const org = await tx.org.create({
        data: { name: input.orgName, slug: `${slug}-${randomSuffix()}` },
      });
      const user = await tx.user.create({
        data: { email: input.email, passwordHash, name: input.name },
      });
      const membership = await tx.membership.create({
        data: { orgId: org.id, userId: user.id, role: "OWNER" },
      });
      return { user, org, membership };
    });

    const tokens = await this.issueTokens(user.id, org.id, membership.role);
    return { ...tokens, orgId: org.id, userId: user.id };
  }

  async login(input: LoginInput): Promise<TokenPair & { orgId: string; userId: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { memberships: { take: 1, orderBy: { createdAt: "asc" } } },
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");
    const ok = await argon2.verify(user.passwordHash, input.password);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    const membership = user.memberships[0];
    if (!membership) throw new UnauthorizedException("No org membership");
    const tokens = await this.issueTokens(user.id, membership.orgId, membership.role);
    return { ...tokens, orgId: membership.orgId, userId: user.id };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string; orgId: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh",
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.refreshHash) throw new UnauthorizedException("Session ended");
    const matches = await argon2.verify(user.refreshHash, refreshToken);
    if (!matches) throw new UnauthorizedException("Invalid refresh token");

    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.id, orgId: payload.orgId },
    });
    if (!membership) throw new UnauthorizedException("Membership gone");
    return this.issueTokens(user.id, membership.orgId, membership.role);
  }

  private async issueTokens(
    userId: string,
    orgId: string,
    role: "OWNER" | "ADMIN" | "MEMBER",
  ): Promise<TokenPair> {
    const access = await this.jwt.signAsync(
      { sub: userId, orgId, role },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev-access",
        expiresIn: process.env.JWT_ACCESS_TTL ?? "15m",
      },
    );
    const refresh = await this.jwt.signAsync(
      { sub: userId, orgId },
      {
        secret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh",
        expiresIn: process.env.JWT_REFRESH_TTL ?? "30d",
      },
    );
    const refreshHash = await argon2.hash(refresh);
    await this.prisma.user.update({ where: { id: userId }, data: { refreshHash } });
    return { accessToken: access, refreshToken: refresh };
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "org";
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}
