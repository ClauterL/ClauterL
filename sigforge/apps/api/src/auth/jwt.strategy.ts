import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";

export interface JwtPayload {
  sub: string;
  orgId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? "dev-access",
    });
  }

  async validate(payload: JwtPayload) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId: payload.sub, orgId: payload.orgId },
    });
    if (!membership) throw new UnauthorizedException("Invalid membership");
    return { userId: payload.sub, orgId: payload.orgId, role: membership.role };
  }
}
