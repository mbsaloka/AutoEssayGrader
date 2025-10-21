import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gradingService, GradeSubmissionRequest } from "@/services";
import toast from "react-hot-toast";

// Query keys
export const gradingKeys = {
  statistics: (assignmentId: number) => ["grading", "statistics", assignmentId] as const,
  grades: (assignmentId: number) => ["grading", "grades", assignmentId] as const,
  studentGrades: (studentId: number) => ["grading", "student", studentId] as const,
};

// Get assignment statistics
export function useAssignmentStatistics(assignmentId: number) {
  return useQuery({
    queryKey: gradingKeys.statistics(assignmentId),
    queryFn: () => gradingService.getAssignmentStatistics(assignmentId),
    enabled: !!assignmentId,
  });
}

// Get assignment grades
export function useAssignmentGrades(assignmentId: number) {
  return useQuery({
    queryKey: gradingKeys.grades(assignmentId),
    queryFn: () => gradingService.getAssignmentGrades(assignmentId),
    enabled: !!assignmentId,
  });
}

// Get student grades
export function useStudentGrades(studentId: number) {
  return useQuery({
    queryKey: gradingKeys.studentGrades(studentId),
    queryFn: () => gradingService.getStudentGrades(studentId),
    enabled: !!studentId,
  });
}

// Grade submission manually
export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, data }: { submissionId: number; data: GradeSubmissionRequest }) =>
      gradingService.gradeSubmission(submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading"] });
      toast.success("Nilai berhasil disimpan!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menyimpan nilai");
    },
  });
}

// Auto-grade single submission
export function useAutoGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: number) => gradingService.autoGradeSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading"] });
      toast.success("Penilaian otomatis berhasil!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal melakukan penilaian otomatis");
    },
  });
}

// Auto-grade all submissions
export function useAutoGradeAllSubmissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId: number) => gradingService.autoGradeAllSubmissions(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading"] });
      toast.success("Penilaian otomatis untuk semua jawaban berhasil!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal melakukan penilaian otomatis");
    },
  });
}

// Delete grade
export function useDeleteGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: number) => gradingService.deleteGrade(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading"] });
      toast.success("Nilai berhasil dihapus!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus nilai");
    },
  });
}

