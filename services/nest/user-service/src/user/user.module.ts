import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';
import { join } from 'path';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'AUTH_SERVICE',
                transport: Transport.GRPC,
                options: {
                    package: 'auth',
                    protoPath: join(__dirname, '../../../../libs/proto/auth.proto'),
                    url: process.env.AUTH_SERVICE_URL || 'auth-service:50051',
                },
            },
        ]),
    ],
    controllers: [UserController],
    providers: [UserService, PrismaService],
})
export class UserModule { }
