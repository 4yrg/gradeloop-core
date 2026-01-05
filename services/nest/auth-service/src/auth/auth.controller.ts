import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @GrpcMethod('AuthService', 'Register')
    async register(data: any) {
        return this.authService.register(data);
    }

    @GrpcMethod('AuthService', 'Login')
    async login(data: any) {
        return this.authService.login(data);
    }

    @GrpcMethod('AuthService', 'ValidateToken')
    async validateToken(data: { token: string }) {
        return this.authService.validateToken(data.token);
    }

    @GrpcMethod('AuthService', 'ForgotPassword')
    async forgotPassword(data: { email: string }) {
        return this.authService.forgotPassword(data.email);
    }

    @GrpcMethod('AuthService', 'ResetPassword')
    async resetPassword(data: any) {
        return this.authService.resetPassword(data);
    }
}