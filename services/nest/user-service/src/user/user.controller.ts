import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from './user.service';

@Controller()
export class UserController {
    constructor(private readonly userService: UserService) { }

    @GrpcMethod('UserService', 'GetProfile')
    async getProfile(data: { user_id: string }) {
        return this.userService.getProfile(data.user_id);
    }

    @GrpcMethod('UserService', 'UpdateProfile')
    async updateProfile(data: any) {
        return this.userService.updateProfile(data);
    }

    @GrpcMethod('UserService', 'CreateInstitute')
    async createInstitute(data: any) {
        return this.userService.createInstitute(data);
    }

    @GrpcMethod('UserService', 'CreateInstituteAdmin')
    async createInstituteAdmin(data: any) {
        return this.userService.createInstituteAdmin(data);
    }

    @GrpcMethod('UserService', 'CreateInstructor')
    async createInstructor(data: any) {
        return this.userService.createInstructor(data);
    }

    @GrpcMethod('UserService', 'CreateStudent')
    async createStudent(data: any) {
        return this.userService.createStudent(data);
    }
}
