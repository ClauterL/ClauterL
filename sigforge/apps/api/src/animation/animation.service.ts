import { Inject, Injectable } from "@nestjs/common";
import {
  ANIMATION_PROVIDER,
  AnimationProvider,
  AnimateInput,
  AnimateOutput,
} from "./animation-provider.interface";

@Injectable()
export class AnimationService {
  constructor(
    @Inject(ANIMATION_PROVIDER) private readonly provider: AnimationProvider,
  ) {}

  animate(input: AnimateInput): Promise<AnimateOutput> {
    return this.provider.animate(input);
  }

  get providerName(): string {
    return this.provider.name;
  }
}
