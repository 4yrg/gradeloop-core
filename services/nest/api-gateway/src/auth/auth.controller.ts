import { Controller, Post, Body, Inject, OnModuleInit, HttpException, HttpStatus } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController implements OnModuleInit {
    private authService: any;

    constructor(@Inject('AUTH_SERVICE') private client: ClientGrpc) { }

    onModuleInit() {
        this.authService = this.client.getService('AuthService');
    }

    @Post('login')
    async login(@Body() body: any) {
        try {
            return await firstValueFrom(this.authService.login(body));
        } catch (e) {
            throw new HttpException(e.message || 'Login failed', HttpStatus.UNAUTHORIZED);
        }
    }

    @Post('register')
    async register(@Body() body: any) {
        try {
            return await firstValueFrom(this.authService.register(body));
        } catch (e) {
            throw new HttpException(e.message || 'Registration failed', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('forgot-password')
    async forgotPassword(@Body() body: any) {
        return await firstValueFrom(this.authService.forgotPassword(body));
    }

    @Post('reset-password')
    async resetPassword(@Body() body: any) {
        return await firstValueFrom(this.authService.resetPassword(body));
    }
}
