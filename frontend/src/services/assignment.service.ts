import { apiClient } from "@/lib/api-client";
import {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  SubmitAnswerRequest,
  AssignmentResponse,
  AssignmentDetailResponse,
  SubmissionResponse,
  MySubmissionResponse,
} from "@/types";

export const assignmentService = {
  // Create a new assignment (Dosen only)
  createAssignment: async (data: CreateAssignmentRequest): Promise<AssignmentResponse> => {
    return apiClient.post<AssignmentResponse>("/api/assignments", data);
  },

  // Get all assignments for a class
  getClassAssignments: async (classId: number): Promise<AssignmentResponse[]> => {
    return apiClient.get<AssignmentResponse[]>(`/api/assignments/class/${classId}`);
  },

  // Get assignment details
  getAssignmentDetails: async (assignmentId: number): Promise<AssignmentDetailResponse> => {
    return apiClient.get<AssignmentDetailResponse>(`/api/assignments/${assignmentId}`);
  },

  // Update assignment (Dosen only)
  updateAssignment: async (
    assignmentId: number,
    data: UpdateAssignmentRequest
  ): Promise<AssignmentResponse> => {
    return apiClient.put<AssignmentResponse>(`/api/assignments/${assignmentId}`, data);
  },

  // Delete assignment (Dosen only)
  deleteAssignment: async (assignmentId: number): Promise<void> => {
    return apiClient.delete<void>(`/api/assignments/${assignmentId}`);
  },

  // Submit answer by typing
  submitTypedAnswer: async (
    assignmentId: number,
    data: SubmitAnswerRequest
  ): Promise<{ message: string; submission_id: number }> => {
    return apiClient.post<{ message: string; submission_id: number }>(
      `/api/assignments/${assignmentId}/submit/typing`,
      data
    );
  },

  // Submit answer by OCR (file upload)
  submitOCRAnswer: async (
    assignmentId: number,
    file: File
  ): Promise<{ message: string; submission_id: number; extracted_text: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    
    return apiClient.uploadFile<{
      message: string;
      submission_id: number;
      extracted_text: string;
    }>(`/api/assignments/${assignmentId}/submit/ocr`, formData);
  },

  // Get all submissions for an assignment (Dosen only)
  getAssignmentSubmissions: async (assignmentId: number): Promise<SubmissionResponse[]> => {
    return apiClient.get<SubmissionResponse[]>(`/api/assignments/${assignmentId}/submissions`);
  },

  // Get current user's submission for an assignment
  getMySubmission: async (assignmentId: number): Promise<MySubmissionResponse> => {
    return apiClient.get<MySubmissionResponse>(`/api/assignments/${assignmentId}/my-submission`);
  },
};

