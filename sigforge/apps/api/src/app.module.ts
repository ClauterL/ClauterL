import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { OrgModule } from "./org/org.module";
import { SignatureModule } from "./signature/signature.module";
import { AssetModule } from "./asset/asset.module";
import { AnimationModule } from "./animation/animation.module";
import { TrackingModule } from "./tracking/tracking.module";
import { TeamModule } from "./team/team.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 120 },
      { name: "tracking", ttl: 1_000, limit: 20 },
    ]),
    PrismaModule,
    AuthModule,
    OrgModule,
    SignatureModule,
    AssetModule,
    AnimationModule,
    TrackingModule,
    TeamModule,
  ],
})
export class AppModule {}
