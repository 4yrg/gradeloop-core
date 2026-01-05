import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service'; // Assuming PrismaService is in ../prisma
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(data: any) {
        const { email, password, role } = data;
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new BadRequestException('User already exists');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                role: role || 'STUDENT',
            },
        });

        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, email: user.email, role: user.role },
        };
    }

    async login(data: any) {
        const { email, password } = data;
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, email: user.email, role: user.role },
        };
    }

    async validateToken(token: string) {
        try {
            const payload = this.jwtService.verify(token);
            return { valid: true, user_id: payload.sub, role: payload.role };
        } catch (e) {
            return { valid: false, user_id: null, role: null };
        }
    }

    async forgotPassword(email: string) {
        // TODO: Implement Forgot Password Logic (Generate token, save to DB, send email)
        return { success: true, message: 'Password reset link sent' };
    }

    async resetPassword(data: any) {
        // TODO: Implement Reset Password Logic (Verify token, hash new password, update user)
        return { success: true, message: 'Password reset successfully' };
    }
}