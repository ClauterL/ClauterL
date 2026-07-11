import { Controller, Get, UseGuards } from "@nestjs/common";
import { OrgService } from "./org.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, RequestUser } from "../common/current-user.decorator";

@Controller("orgs")
@UseGuards(JwtAuthGuard)
export class OrgController {
  constructor(private readonly service: OrgService) {}

  @Get("current")
  current(@CurrentUser() user: RequestUser) {
    return this.service.current(user.orgId);
  }
}
