// Legacy API functions - maintained for backward compatibility
// New code should use services from @/services instead

import { authService, userService, profileService } from "@/services";
import type { User, UserCreate, LoginRequest, LoginResponse, RegisterResponse, UserUpdate } from "@/types";

// Re-export types for backward compatibility
export type { User };

export interface UpdateProfileData {
  fullname?: string;
  email?: string;
  username?: string;
  notelp?: string;
  institution?: string;
  biografi?: string;
  profile_picture?: string;
}

export interface RegisterData {
  fullname: string;
  username: string;
  email: string;
  password: string;
  notelp?: string;
  institution?: string;
  biografi?: string;
  profile_picture?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export { type RegisterResponse };

export interface ApiError {
  detail: string;
}

// Legacy wrapper functions using new services
export const registerUser = async (data: RegisterData): Promise<RegisterResponse> => {
  return authService.register(data as UserCreate);
};

export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  return authService.login(data as LoginRequest);
};

export const getCurrentUser = async (token: string): Promise<User> => {
  return authService.getCurrentUser();
};

export const getGoogleAuthUrl = async (): Promise<string> => {
  const result = await authService.getGoogleAuthUrl();
  return result.authorization_url;
};

export const getGithubAuthUrl = async (): Promise<string> => {
  const result = await authService.getGithubAuthUrl();
  return result.authorization_url;
};

export const updateUserProfile = async (token: string, data: UpdateProfileData): Promise<User> => {
  return userService.updateProfile(data as UserUpdate);
};

export const changePassword = async (
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> => {
  return profileService.changePassword({
    current_password: currentPassword,
    new_password: newPassword,
  });
};

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function getCookieValue(name: string): string | null {
  if (typeof window === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

export const saveAuthData = (token: string, user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const cookieToken = getCookieValue('token');
    if (cookieToken) {
      return cookieToken;
    }
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
  }
  return null;
};

export const getAuthUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};
