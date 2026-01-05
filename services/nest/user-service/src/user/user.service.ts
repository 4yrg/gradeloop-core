import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Injectable()
export class UserService implements OnModuleInit {
    @Client({
        transport: Transport.GRPC,
        options: {
            package: 'auth',
            protoPath: join(__dirname, '../../../../libs/proto/auth.proto'),
            url: process.env.AUTH_SERVICE_URL || 'auth-service:50051',
        },
    })
    private client: ClientGrpc;

    private authService: any; // Interface would be better

    constructor(private prisma: PrismaService) { }

    onModuleInit() {
        this.authService = this.client.getService<any>('AuthService');
    }

    async getProfile(userId: string) {
        return this.prisma.profile.findUnique({
            where: { userId },
            include: {
                institute: true, // Assuming relation exists or we fetch manually
                student: true,
                instructor: true
            }
        });
    }

    async updateProfile(data: any) {
        return this.prisma.profile.update({
            where: { userId: data.user_id },
            data: {
                firstName: data.first_name,
                lastName: data.last_name,
                avatarUrl: data.avatar_url,
            },
        });
    }

    async createInstitute(data: any) {
        const { name, code, domain, admin_email } = data;
        const institute = await this.prisma.institute.create({
            data: { name, code, domain },
        });

        // Create Admin User for this institute
        await this.createInstituteAdmin({
            email: admin_email,
            institute_id: institute.id,
            first_name: 'Admin',
            last_name: 'User'
        });

        return institute;
    }

    async createInstituteAdmin(data: any) {
        // 1. Create Credential in Auth Service
        const authUser = await this.authService.createUserCredential({
            email: data.email,
            role: 'INSTITUTE_ADMIN',
            temp_password: true
        }).toPromise();

        // 2. Create Profile locally
        const profile = await this.prisma.profile.create({
            data: {
                userId: authUser.user_id,
                firstName: data.first_name,
                lastName: data.last_name,
            }
        });

        // 3. Link to Institute
        await this.prisma.instituteMember.create({
            data: {
                userId: authUser.user_id,
                instituteId: data.institute_id,
                role: 'INSTITUTE_ADMIN'
            }
        });

        return { ...authUser, ...profile };
    }

    async createStudent(data: any) {
        // 1. Create Credential
        const authUser = await this.authService.createUserCredential({
            email: data.email,
            role: 'STUDENT',
            temp_password: true
        }).toPromise();

        // 2. Create Profile
        const profile = await this.prisma.profile.create({
            data: {
                userId: authUser.user_id,
                firstName: data.first_name,
                lastName: data.last_name,
            }
        });

        // 3. Create Student Record
        await this.prisma.student.create({
            data: {
                userId: authUser.user_id,
                enrollmentNumber: data.enrollment_number
            }
        });

        // 4. Link to Institute
        await this.prisma.instituteMember.create({
            data: {
                userId: authUser.user_id,
                instituteId: data.institute_id,
                role: 'STUDENT'
            }
        });

        return { ...authUser, ...profile };
    }

    async createInstructor(data: any) {
        // 1. Create Credential
        const authUser = await this.authService.createUserCredential({
            email: data.email,
            role: 'INSTRUCTOR',
            temp_password: true
        }).toPromise();

        // 2. Create Profile
        const profile = await this.prisma.profile.create({
            data: {
                userId: authUser.user_id,
                firstName: data.first_name,
                lastName: data.last_name,
            }
        });

        // 3. Create Instructor Record
        await this.prisma.instructor.create({
            data: {
                userId: authUser.user_id,
                specialization: data.specialization
            }
        });

        // 4. Link to Institute
        await this.prisma.instituteMember.create({
            data: {
                userId: authUser.user_id,
                instituteId: data.institute_id,
                role: 'INSTRUCTOR'
            }
        });

        return { ...authUser, ...profile };
    }
}
