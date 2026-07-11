import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  async current(orgId: string) {
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
      include: {
        memberships: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!org) throw new NotFoundException();
    return org;
  }
}
