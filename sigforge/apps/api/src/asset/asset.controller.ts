import {
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { AssetService } from "./asset.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, RequestUser } from "../common/current-user.decorator";
import type { AnimationPreset } from "@sigforge/shared";

@Controller()
export class AssetController {
  constructor(private readonly assets: AssetService) {}

  @Post("signatures/:id/logo")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  async uploadLogo(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body("preset") preset: AnimationPreset = "fade-loop",
  ) {
    if (!file) throw new NotFoundException("Missing file");
    await this.assets.putLogo(user.orgId, id, file.buffer, preset);
    return { ok: true };
  }

  @Post("signatures/:id/photo")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  async uploadPhoto(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new NotFoundException("Missing file");
    await this.assets.putPhoto(user.orgId, id, file.buffer);
    return { ok: true };
  }

  @Get("s/:signatureId/:filename")
  @Header("cache-control", "public, max-age=31536000, immutable")
  async publicAsset(
    @Param("signatureId") signatureId: string,
    @Param("filename") filename: string,
    @Res() res: Response,
  ) {
    const { asset } = await this.assets.getSignatureAndAsset(signatureId, filename);
    res.setHeader("content-type", asset.mimeType);
    res.setHeader("content-length", String(asset.buffer.byteLength));
    res.end(asset.buffer);
  }
}
