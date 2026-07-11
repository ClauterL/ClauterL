import { PipeTransform, BadRequestException, Injectable } from "@nestjs/common";
import { ZodSchema } from "zod";

@Injectable()
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation failed",
        issues: result.error.flatten(),
      });
    }
    return result.data;
  }
}
