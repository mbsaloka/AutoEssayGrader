import { apiClient } from "@/lib/api-client";
import {
  ProfileResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@/types";

export const profileService = {
  // Get current user's profile
  getProfile: async (): Promise<ProfileResponse> => {
    return apiClient.get<ProfileResponse>("/api/profile/me");
  },

  // Update current user's profile
  updateProfile: async (data: UpdateProfileRequest): Promise<ProfileResponse> => {
    return apiClient.put<ProfileResponse>("/api/profile/me", data);
  },

  // Change password
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>("/api/profile/me/change-password", data);
  },

  // Upload profile photo
  uploadProfilePhoto: async (file: File): Promise<{ message: string; photo_url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    
    return apiClient.uploadFile<{ message: string; photo_url: string }>(
      "/api/profile/me/upload-photo",
      formData
    );
  },
};

