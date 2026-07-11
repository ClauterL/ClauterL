import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, RequestUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { SignatureService } from "./signature.service";
import { CreateSignatureInput, UpdateSignatureInput } from "@sigforge/shared";

const ASSET_BASE = () => process.env.PUBLIC_ASSET_BASE_URL ?? "http://localhost:4000";

@Controller("signatures")
@UseGuards(JwtAuthGuard)
export class SignatureController {
  constructor(private readonly service: SignatureService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.service.list(user.orgId);
  }

  @Get(":id")
  findOne(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.service.findOne(user.orgId, id);
  }

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodPipe(CreateSignatureInput)) body: CreateSignatureInput,
  ) {
    return this.service.create(user.orgId, user.userId, body);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body(new ZodPipe(UpdateSignatureInput)) body: UpdateSignatureInput,
  ) {
    return this.service.update(user.orgId, id, body);
  }

  @Post(":id/duplicate")
  duplicate(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.service.duplicate(user.orgId, id, user.userId);
  }

  @Delete(":id")
  remove(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.service.remove(user.orgId, id);
  }

  @Get(":id/html")
  @Header("content-type", "text/html; charset=utf-8")
  async html(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.service.renderHtml(user.orgId, id, ASSET_BASE());
  }
}
