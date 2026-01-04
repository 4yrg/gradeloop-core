import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AuthProxyService {
  private readonly authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

  async login(loginDto: any) {
    try {
      const response = await axios.post(`${this.authServiceUrl}/auth/login`, loginDto);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Authentication failed');
      }
      throw new Error('Auth service unavailable');
    }
  }

  async forgotPassword(forgotPasswordDto: any) {
    try {
      const response = await axios.post(`${this.authServiceUrl}/auth/forgot-password`, forgotPasswordDto);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Password reset request failed');
      }
      throw new Error('Auth service unavailable');
    }
  }

  async resetPassword(resetPasswordDto: any) {
    try {
      const response = await axios.post(`${this.authServiceUrl}/auth/reset-password`, resetPasswordDto);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Password reset failed');
      }
      throw new Error('Auth service unavailable');
    }
  }

  async getProfile(token: string) {
    try {
      const response = await axios.get(`${this.authServiceUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to get user profile');
      }
      throw new Error('Auth service unavailable');
    }
  }
}