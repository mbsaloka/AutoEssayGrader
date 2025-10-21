import { apiClient } from "@/lib/api-client";
import {
  GradeSubmissionRequest,
  NilaiResponse,
  AutoGradeResponse,
  AutoGradeAllResponse,
  AssignmentStatisticsResponse,
  SubmissionDetailResponse,
} from "@/types";

export const gradingService = {
  // Manually grade a submission (Dosen only)
  gradeSubmission: async (
    submissionId: number,
    data: GradeSubmissionRequest
  ): Promise<{ message: string; nilai_id: number }> => {
    return apiClient.post<{ message: string; nilai_id: number }>(
      `/api/grading/submissions/${submissionId}/grade`,
      data
    );
  },

  // Auto-grade a single submission (Dosen only)
  autoGradeSubmission: async (submissionId: number): Promise<AutoGradeResponse> => {
    return apiClient.post<AutoGradeResponse>(
      `/api/grading/submissions/${submissionId}/auto-grade`,
      {}
    );
  },

  // Auto-grade all ungraded submissions for an assignment (Dosen only)
  autoGradeAllSubmissions: async (assignmentId: number): Promise<AutoGradeAllResponse> => {
    return apiClient.post<AutoGradeAllResponse>(
      `/api/grading/assignments/${assignmentId}/auto-grade-all`,
      {}
    );
  },

  // Get grading statistics for an assignment (Dosen only)
  getAssignmentStatistics: async (assignmentId: number): Promise<AssignmentStatisticsResponse> => {
    return apiClient.get<AssignmentStatisticsResponse>(
      `/api/grading/assignments/${assignmentId}/statistics`
    );
  },

  // Get all grades for an assignment (Dosen only)
  getAssignmentGrades: async (assignmentId: number): Promise<NilaiResponse[]> => {
    return apiClient.get<NilaiResponse[]>(`/api/grading/assignments/${assignmentId}/grades`);
  },

  // Get all grades for a specific student
  getStudentGrades: async (studentId: number): Promise<NilaiResponse[]> => {
    return apiClient.get<NilaiResponse[]>(`/api/grading/students/${studentId}/grades`);
  },

  // Get detailed grading information for a specific submission (Teacher access)
  getSubmissionDetails: async (submissionId: number): Promise<SubmissionDetailResponse> => {
    return apiClient.get<SubmissionDetailResponse>(`/api/grading/submissions/${submissionId}/details`);
  },

  // Get a single grade by ID
  getGradeById: async (gradeId: number): Promise<NilaiResponse> => {
    // Since there's no specific endpoint, we'll need to implement this differently
    // For now, returning from the grades list would work
    throw new Error("Not implemented - use getAssignmentGrades instead");
  },

  // Delete a grade for a submission (Dosen only)
  deleteGrade: async (submissionId: number): Promise<void> => {
    return apiClient.delete<void>(`/api/grading/submissions/${submissionId}/grade`);
  },
};

