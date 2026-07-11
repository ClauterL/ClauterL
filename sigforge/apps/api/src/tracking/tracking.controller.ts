import {
  Controller,
  Get,
  Header,
  Param,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { TrackingService } from "./tracking.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, RequestUser } from "../common/current-user.decorator";
import { Throttle } from "@nestjs/throttler";

@Controller()
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  @Get("t/:signatureId/pixel.gif")
  @Header("cache-control", "no-store, no-cache, must-revalidate")
  @Header("pragma", "no-cache")
  @Throttle({ tracking: { limit: 20, ttl: 1000 } })
  async pixel(
    @Param("signatureId") signatureId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    void this.tracking.recordImpression(
      signatureId,
      clientIp(req),
      req.headers["user-agent"],
    );
    res.setHeader("content-type", "image/gif");
    res.setHeader("content-length", String(this.tracking.pixelBytes.byteLength));
    res.end(this.tracking.pixelBytes);
  }

  @Get("r/:linkId")
  async redirect(
    @Param("linkId") linkId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const target = await this.tracking.resolveClick(
      linkId,
      clientIp(req),
      req.headers["user-agent"],
    );
    if (!target) {
      res.status(404).send("Not found");
      return;
    }
    res.redirect(302, target);
  }

  @Get("signatures/:id/analytics")
  @UseGuards(JwtAuthGuard)
  async analytics(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
  ) {
    void user;
    const [summary, chart] = await Promise.all([
      this.tracking.summary(id),
      this.tracking.dailyChart(id),
    ]);
    return { summary, chart };
  }
}

function clientIp(req: Request): string | undefined {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  if (Array.isArray(fwd) && fwd[0]) return fwd[0];
  return req.socket.remoteAddress ?? undefined;
}
