import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
    async sendPasswordResetEmail(email: string, token: string): Promise<void> {
        // For development, just log the reset link
        console.log(`Password reset email for ${email}`);
        console.log(`Reset link: http://localhost:3000/auth/reset-password?token=${token}`);

        // TODO: Implement actual email sending with nodemailer
        // const transporter = nodemailer.createTransporter({...});
        // await transporter.sendMail({...});
    }
}