import { Controller, Post, Body, Inject, OnModuleInit, HttpException, HttpStatus } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('users')
export class UserController implements OnModuleInit {
    private userService: any;

    constructor(@Inject('USER_SERVICE') private client: ClientGrpc) { }

    onModuleInit() {
        this.userService = this.client.getService('UserService');
    }

    @Post('institute')
    async createInstitute(@Body() body: any) {
        try {
            return await firstValueFrom(this.userService.createInstitute(body));
        } catch (e) {
            throw new HttpException(e.message || 'Failed to create institute', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('admin')
    async createInstituteAdmin(@Body() body: any) {
        return await firstValueFrom(this.userService.createInstituteAdmin(body));
    }

    @Post('instructor')
    async createInstructor(@Body() body: any) {
        return await firstValueFrom(this.userService.createInstructor(body));
    }

    @Post('student')
    async createStudent(@Body() body: any) {
        return await firstValueFrom(this.userService.createStudent(body));
    }
}
