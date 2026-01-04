import { Controller, Post, Body, ValidationPipe, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import {
    LoginDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    LoginResponseDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<LoginResponseDto> {
        return this.authService.login(loginDto);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(
        @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
    ): Promise<{ message: string }> {
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(
        @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
    ): Promise<{ message: string }> {
        return this.authService.resetPassword(resetPasswordDto);
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async getProfile(@Request() req: any) {
        return {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
        };
    }
}