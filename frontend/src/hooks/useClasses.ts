import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	classService,
	CreateClassRequest,
	UpdateClassRequest,
	JoinClassRequest,
} from "@/services";
import toast from "react-hot-toast";

// Query keys
export const classKeys = {
	all: ["classes"] as const,
	detail: (id: number) => ["classes", id] as const,
	search: (query: string) => ["classes", "search", query] as const,
};

// Get all classes
export function useClasses() {
	return useQuery({
		queryKey: classKeys.all,
		queryFn: classService.getAllClasses,
	});
}

// Get class details
export function useClassDetail(classId: number) {
	return useQuery({
		queryKey: classKeys.detail(classId),
		queryFn: () => classService.getClassDetails(classId),
		enabled: !!classId,
	});
}

// Search classes
export function useSearchClasses(query: string) {
	return useQuery({
		queryKey: classKeys.search(query),
		queryFn: () => classService.searchClasses(query),
		enabled: query.length > 0,
	});
}

// Create class
export function useCreateClass() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateClassRequest) =>
			classService.createClass(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: classKeys.all });
			toast.success("Kelas berhasil dibuat!");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Gagal membuat kelas");
		},
	});
}

// Update class
export function useUpdateClass() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			classId,
			data,
		}: {
			classId: number;
			data: UpdateClassRequest;
		}) => classService.updateClass(classId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: classKeys.all });
			queryClient.invalidateQueries({
				queryKey: classKeys.detail(variables.classId),
			});
			toast.success("Kelas berhasil diperbarui!");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Gagal memperbarui kelas");
		},
	});
}

// Delete class
export function useDeleteClass() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (classId: number) => classService.deleteClass(classId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: classKeys.all });
			toast.success("Kelas berhasil dihapus!");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Gagal menghapus kelas");
		},
	});
}

// Join class
export function useJoinClass() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: JoinClassRequest) => classService.joinClass(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: classKeys.all });
			toast.success("Berhasil bergabung dengan kelas!");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Gagal bergabung dengan kelas");
		},
	});
}

// Get invite code
export function useGetInviteCode() {
	return useMutation({
		mutationFn: (classId: number) => classService.getInviteCode(classId),
		onError: (error: Error) => {
			toast.error(error.message || "Gagal mendapatkan kode undangan");
		},
	});
}

// Remove participant
export function useRemoveParticipant() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			classId,
			userId,
		}: {
			classId: number;
			userId: number;
		}) => classService.removeParticipant(classId, userId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: classKeys.detail(variables.classId),
			});
			toast.success("Peserta berhasil dihapus!");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Gagal menghapus peserta");
		},
	});
}
