import { apiClient } from "@/lib/api-client";
import {
	UserCreate,
	LoginRequest,
	LoginResponse,
	RegisterResponse,
	User,
} from "@/types";

export const authService = {
	// Register a new user
	register: async (data: UserCreate): Promise<RegisterResponse> => {
		return apiClient.post<RegisterResponse>("/api/auth/register", data);
	},

	// Login with email and password
	login: async (data: LoginRequest): Promise<LoginResponse> => {
		return apiClient.post<LoginResponse>("/api/auth/login", data);
	},

	// Get current authenticated user
	getCurrentUser: async (): Promise<User> => {
		return apiClient.get<User>("/api/auth/me");
	},

	// Logout user
	logout: async (token: string): Promise<{ message: string }> => {
		return apiClient.post<{ message: string }>("/api/auth/logout", {
			token,
		});
	},

	// Get Google OAuth URL
	getGoogleAuthUrl: async (): Promise<{ authorization_url: string }> => {
		return apiClient.get<{ authorization_url: string }>(
			"/api/auth/oauth/google"
		);
	},

	// Get GitHub OAuth URL
	getGithubAuthUrl: async (): Promise<{ authorization_url: string }> => {
		return apiClient.get<{ authorization_url: string }>(
			"/api/auth/oauth/github"
		);
	},
};
