import { apiClient } from "@/lib/api-client";
import {
	CreateClassRequest,
	UpdateClassRequest,
	JoinClassRequest,
	ClassResponse,
	ClassDetailResponse,
	InviteCodeResponse,
} from "@/types";

export const classService = {
	// Create a new class (Dosen only)
	createClass: async (data: CreateClassRequest): Promise<ClassResponse> => {
		return apiClient.post<ClassResponse>("/api/classes", data);
	},

	// Search for classes
	searchClasses: async (query: string): Promise<ClassResponse[]> => {
		return apiClient.get<ClassResponse[]>(
			`/api/classes/search?query=${encodeURIComponent(query)}`
		);
	},

	// Get all classes for current user
	getAllClasses: async (): Promise<ClassResponse[]> => {
		return apiClient.get<ClassResponse[]>("/api/classes");
	},

	// Get class details
	getClassDetails: async (classId: number): Promise<ClassDetailResponse> => {
		return apiClient.get<ClassDetailResponse>(`/api/classes/${classId}`);
	},

	// Update class (Dosen only)
	updateClass: async (
		classId: number,
		data: UpdateClassRequest
	): Promise<ClassResponse> => {
		return apiClient.put<ClassResponse>(`/api/classes/${classId}`, data);
	},

	// Delete class (Dosen only)
	deleteClass: async (classId: number): Promise<void> => {
		return apiClient.delete<void>(`/api/classes/${classId}`);
	},

	// Join class using class code
	joinClass: async (
		data: JoinClassRequest
	): Promise<{ message: string; class_id: number }> => {
		return apiClient.post<{ message: string; class_id: number }>(
			"/api/classes/join",
			data
		);
	},

	// Get invite code for a class (Dosen only)
	getInviteCode: async (classId: number): Promise<InviteCodeResponse> => {
		return apiClient.post<InviteCodeResponse>(
			`/api/classes/${classId}/invite`,
			{}
		);
	},

	// Remove participant from class (Dosen only)
	removeParticipant: async (
		classId: number,
		userId: number
	): Promise<void> => {
		return apiClient.delete<void>(
			`/api/classes/${classId}/participants/${userId}`
		);
	},
};
