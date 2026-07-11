import { Injectable, Logger } from "@nestjs/common";
import type {
  AnimationProvider,
  AnimateInput,
  AnimateOutput,
} from "../animation-provider.interface";

/**
 * Placeholder for an external AI-based logo animation provider.
 * Wire this up when the vendor is chosen — the interface is the contract.
 */
@Injectable()
export class ExternalAiProvider implements AnimationProvider {
  readonly name = "external";
  private readonly logger = new Logger(ExternalAiProvider.name);

  async animate(_input: AnimateInput): Promise<AnimateOutput> {
    this.logger.warn("ExternalAiProvider not yet wired — set ANIMATION_PROVIDER=local for MVP");
    throw new Error("external animation provider not configured");
  }
}
