import { Module } from "@nestjs/common";
import { AnimationService } from "./animation.service";
import { ANIMATION_PROVIDER } from "./animation-provider.interface";
import { LocalGifProvider } from "./providers/local-gif.provider";
import { ExternalAiProvider } from "./providers/external-ai.provider";

@Module({
  providers: [
    LocalGifProvider,
    ExternalAiProvider,
    {
      provide: ANIMATION_PROVIDER,
      useFactory: (local: LocalGifProvider, external: ExternalAiProvider) => {
        const which = (process.env.ANIMATION_PROVIDER ?? "local").toLowerCase();
        return which === "external" ? external : local;
      },
      inject: [LocalGifProvider, ExternalAiProvider],
    },
    AnimationService,
  ],
  exports: [AnimationService],
})
export class AnimationModule {}
