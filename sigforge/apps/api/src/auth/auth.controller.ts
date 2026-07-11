import { Body, Controller, Post, UsePipes } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ZodPipe } from "../common/zod.pipe";
import {
  LoginInput,
  RegisterInput,
  RefreshInput,
} from "@sigforge/shared";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @UsePipes(new ZodPipe(RegisterInput))
  register(@Body() body: RegisterInput) {
    return this.auth.register(body);
  }

  @Post("login")
  @UsePipes(new ZodPipe(LoginInput))
  login(@Body() body: LoginInput) {
    return this.auth.login(body);
  }

  @Post("refresh")
  @UsePipes(new ZodPipe(RefreshInput))
  refresh(@Body() body: RefreshInput) {
    return this.auth.refresh(body.refreshToken);
  }
}
