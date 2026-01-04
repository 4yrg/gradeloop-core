import { Controller, Post, Body, ValidationPipe, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthProxyService } from './auth-proxy.service';

@Controller('auth')
export class AuthProxyController {
  constructor(private readonly authProxyService: AuthProxyService) {}

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: any) {
    return this.authProxyService.login(loginDto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body(ValidationPipe) forgotPasswordDto: any) {
    return this.authProxyService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body(ValidationPipe) resetPasswordDto: any) {
    return this.authProxyService.resetPassword(resetPasswordDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    // In a real scenario, you could either:
    // 1. Return the user info from the JWT payload (faster)
    // 2. Proxy the request to the auth service for fresh data
    return {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    };
  }
}