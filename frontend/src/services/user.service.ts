import { apiClient } from "@/lib/api-client";
import { User, UserUpdate } from "@/types";

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
}

export const userService = {
  // Get all users (superuser only)
  getAllUsers: async (skip = 0, limit = 100): Promise<UserResponse[]> => {
    return apiClient.get<UserResponse[]>(`/api/users?skip=${skip}&limit=${limit}`);
  },

  // Get current user
  getCurrentUser: async (): Promise<UserResponse> => {
    return apiClient.get<UserResponse>("/api/users/me");
  },

  // Get user by ID
  getUserById: async (userId: number): Promise<UserResponse> => {
    return apiClient.get<UserResponse>(`/api/users/${userId}`);
  },

  // Update current user profile
  updateProfile: async (data: UserUpdate): Promise<User> => {
    return apiClient.patch<User>("/api/users/me", data);
  },

  // Delete current user
  deleteAccount: async (): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>("/api/users/me");
  },

  // Delete user by ID (superuser only)
  deleteUser: async (userId: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/api/users/${userId}`);
  },
};

