import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { TeamService } from "./team.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, RequestUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { DeployToTeamInput, InviteMemberInput } from "@sigforge/shared";

@Controller("team")
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private readonly service: TeamService) {}

  @Post("invite")
  invite(
    @CurrentUser() user: RequestUser,
    @Body(new ZodPipe(InviteMemberInput)) body: InviteMemberInput,
  ) {
    return this.service.invite(user.orgId, user.userId, body);
  }

  @Post("deploy")
  deploy(
    @CurrentUser() user: RequestUser,
    @Body(new ZodPipe(DeployToTeamInput)) body: DeployToTeamInput,
  ) {
    return this.service.deploy(user.orgId, user.userId, body);
  }
}
