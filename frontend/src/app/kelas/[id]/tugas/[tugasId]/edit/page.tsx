"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import { useAuth } from "@/context/AuthContext";
import { assignmentService } from "@/services";
import toast from "react-hot-toast";
import {
	ArrowLeft,
	Books,
	Plus,
	Trash,
	FloppyDisk,
	Eye,
	EyeSlash,
} from "phosphor-react";
import type {
	AssignmentDetailResponse,
	UpdateAssignmentRequest,
} from "@/types";

export default function EditAssignmentPage() {
	return (
		<ProtectedRoute>
			<EditAssignmentContent />
		</ProtectedRoute>
	);
}

interface QuestionFormData {
	id?: number;
	question_text: string;
	reference_answer: string;
	points: number;
	_isNew?: boolean;
}

function EditAssignmentContent() {
	const router = useRouter();
	const params = useParams();
	const queryClient = useQueryClient();
	const { user } = useAuth();

	const classId = parseInt(params.id as string);
	const assignmentId = parseInt(params.tugasId as string);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [deadline, setDeadline] = useState("");
	const [isPublished, setIsPublished] = useState(true);
	const [questions, setQuestions] = useState<QuestionFormData[]>([]);

	const {
		data: assignment,
		isLoading,
		error,
	} = useQuery<AssignmentDetailResponse>({
		queryKey: ["assignment", assignmentId],
		queryFn: () => assignmentService.getAssignmentDetails(assignmentId),
	});

	useEffect(() => {
		if (assignment) {
			setTitle(assignment.title);
			setDescription(assignment.description || "");
			setIsPublished(assignment.is_published);

			if (assignment.deadline) {
				const date = new Date(assignment.deadline);
				const formatted = date.toISOString().slice(0, 16);
				setDeadline(formatted);
			}

			if (assignment.questions && assignment.questions.length > 0) {
				const sortedQuestions = [...assignment.questions].sort(
					(a, b) => a.question_order - b.question_order
				);
				setQuestions(
					sortedQuestions.map((q) => ({
						id: q.id,
						question_text: q.question_text,
						reference_answer: q.reference_answer,
						points: q.points,
						_isNew: false,
					}))
				);
			}
		}
	}, [assignment]);

	const updateMutation = useMutation({
		mutationFn: (data: UpdateAssignmentRequest) =>
			assignmentService.updateAssignment(assignmentId, data),
		onSuccess: () => {
			toast.success("Tugas berhasil diperbarui!");
			queryClient.invalidateQueries({
				queryKey: ["assignment", assignmentId],
			});
			queryClient.invalidateQueries({
				queryKey: ["classAssignments", classId],
			});
			router.push(`/kelas/${classId}/tugas/${assignmentId}`);
		},
		onError: (error: Error) => {
			console.error("Update error:", error);
			toast.error(
				error.message || "Terjadi kesalahan saat memperbarui tugas"
			);
		},
	});

	const handleBack = () => {
		router.push(`/kelas/${classId}/tugas/${assignmentId}`);
	};

	const handleAddQuestion = () => {
		setQuestions([
			...questions,
			{
				question_text: "",
				reference_answer: "",
				points: 10,
				_isNew: true,
			},
		]);
	};

	const handleRemoveQuestion = (index: number) => {
		setQuestions(questions.filter((_, i) => i !== index));
	};

	const handleQuestionChange = (
		index: number,
		field: keyof QuestionFormData,
		value: string | number
	) => {
		setQuestions(
			questions.map((q, i) =>
				i === index ? { ...q, [field]: value } : q
			)
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!title.trim()) {
			toast.error("Judul tugas harus diisi");
			return;
		}

		if (questions.length === 0) {
			toast.error("Minimal harus ada 1 soal");
			return;
		}

		for (let i = 0; i < questions.length; i++) {
			const q = questions[i];
			if (!q.question_text.trim()) {
				toast.error(`Soal ${i + 1} harus diisi`);
				return;
			}
			if (!q.reference_answer.trim()) {
				toast.error(`Kunci jawaban soal ${i + 1} harus diisi`);
				return;
			}
			if (q.points <= 0) {
				toast.error(`Poin soal ${i + 1} harus lebih dari 0`);
				return;
			}
		}

		const updateData: UpdateAssignmentRequest = {
			title: title.trim(),
			description: description.trim() || undefined,
			deadline: deadline ? new Date(deadline).toISOString() : undefined,
			is_published: isPublished,
			questions: questions.map((q) => ({
				id: q._isNew ? undefined : q.id,
				question_text: q.question_text.trim(),
				reference_answer: q.reference_answer.trim(),
				points: q.points,
			})),
		};

		updateMutation.mutate(updateData);
	};

	if (user?.user_role !== "dosen") {
		return (
			<div className="min-h-screen flex flex-col bg-[#2b2d31]">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<h2 className="text-xl font-semibold text-white mb-2">
							Akses Ditolak
						</h2>
						<p className="text-gray-400 mb-4">
							Hanya dosen yang dapat mengedit tugas
						</p>
						<Button onClick={handleBack}>Kembali</Button>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen flex flex-col bg-[#2b2d31]">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<LoadingSpinner size="lg" text="Memuat data tugas..." />
				</div>
				<Footer />
			</div>
		);
	}

	if (error || !assignment) {
		return (
			<div className="min-h-screen flex flex-col bg-[#2b2d31]">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<h2 className="text-xl font-semibold text-white mb-2">
							Tugas tidak ditemukan
						</h2>
						<Button onClick={handleBack}>Kembali</Button>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col bg-[#2b2d31]">
			<Navbar />

			<main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-4">
							<button
								onClick={handleBack}
								className="text-white hover:text-gray-300 transition-colors"
							>
								<ArrowLeft className="w-6 h-6" weight="bold" />
							</button>
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
									<Books
										className="w-6 h-6 text-white"
										weight="bold"
									/>
								</div>
								<div>
									<h1 className="text-2xl sm:text-3xl font-bold text-white">
										Edit Tugas
									</h1>
									<p className="text-sm text-gray-400 mt-1">
										{assignment.class_name}
									</p>
								</div>
							</div>
						</div>

						{/* Save Button - Desktop */}
						<div className="hidden sm:block">
							<Button
								onClick={handleSubmit}
								variant="primary"
								size="md"
								className="flex items-center gap-2"
								disabled={updateMutation.isPending}
								isLoading={updateMutation.isPending}
							>
								<FloppyDisk className="w-5 h-5" weight="bold" />
								Simpan Perubahan
							</Button>
						</div>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-8">
					{/* Basic Information */}
					<div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-6">
						<h2 className="text-xl font-semibold text-white mb-6">
							Informasi Dasar
						</h2>

						<div className="space-y-4">
							{/* Title */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Judul Tugas{" "}
									<span className="text-red-400">*</span>
								</label>
								<Input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Masukkan judul tugas"
									required
								/>
							</div>

							{/* Description */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Deskripsi
								</label>
								<Textarea
									value={description}
									onChange={(e) =>
										setDescription(e.target.value)
									}
									placeholder="Masukkan deskripsi tugas (opsional)"
									rows={4}
								/>
							</div>

							{/* Deadline */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Deadline
								</label>
								<Input
									type="datetime-local"
									value={deadline}
									onChange={(e) =>
										setDeadline(e.target.value)
									}
								/>
								<p className="text-xs text-gray-400 mt-1">
									Kosongkan jika tidak ada deadline
								</p>
							</div>

							{/* Published Status */}
							<div>
								<label className="flex items-center gap-3 cursor-pointer">
									<input
										type="checkbox"
										checked={isPublished}
										onChange={(e) =>
											setIsPublished(e.target.checked)
										}
										className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
									/>
									<div className="flex items-center gap-2">
										{isPublished ? (
											<Eye
												className="w-5 h-5 text-green-400"
												weight="bold"
											/>
										) : (
											<EyeSlash
												className="w-5 h-5 text-gray-400"
												weight="bold"
											/>
										)}
										<span className="text-sm font-medium text-gray-300">
											Publikasikan tugas (mahasiswa dapat
											melihat)
										</span>
									</div>
								</label>
							</div>
						</div>
					</div>

					{/* Questions Section */}
					<div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-semibold text-white">
								Soal ({questions.length})
							</h2>
							<Button
								type="button"
								onClick={handleAddQuestion}
								variant="outline"
								size="sm"
								className="flex items-center gap-2"
							>
								<Plus className="w-4 h-4" weight="bold" />
								Tambah Soal
							</Button>
						</div>

						{questions.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-gray-400 mb-4">
									Belum ada soal. Klik tombol di atas untuk
									menambah soal.
								</p>
							</div>
						) : (
							<div className="space-y-6">
								{questions.map((question, index) => (
									<div
										key={index}
										className="bg-[#2b2d31] border border-gray-700 rounded-lg p-4"
									>
										<div className="flex items-start justify-between mb-4">
											<h3 className="text-lg font-semibold text-white">
												Soal {index + 1}
												{question._isNew && (
													<span className="ml-2 text-xs text-green-400">
														(Baru)
													</span>
												)}
											</h3>
											{questions.length > 1 && (
												<button
													type="button"
													onClick={() =>
														handleRemoveQuestion(
															index
														)
													}
													className="text-red-400 hover:text-red-300 transition-colors"
												>
													<Trash
														className="w-5 h-5"
														weight="bold"
													/>
												</button>
											)}
										</div>

										<div className="space-y-4">
											{/* Question Text */}
											<div>
												<label className="block text-sm font-medium text-gray-300 mb-2">
													Pertanyaan{" "}
													<span className="text-red-400">
														*
													</span>
												</label>
												<Textarea
													value={
														question.question_text
													}
													onChange={(e) =>
														handleQuestionChange(
															index,
															"question_text",
															e.target.value
														)
													}
													placeholder="Masukkan pertanyaan"
													rows={3}
													required
												/>
											</div>

											{/* Reference Answer */}
											<div>
												<label className="block text-sm font-medium text-gray-300 mb-2">
													Kunci Jawaban{" "}
													<span className="text-red-400">
														*
													</span>
												</label>
												<Textarea
													value={
														question.reference_answer
													}
													onChange={(e) =>
														handleQuestionChange(
															index,
															"reference_answer",
															e.target.value
														)
													}
													placeholder="Masukkan kunci jawaban"
													rows={4}
													required
												/>
												<p className="text-xs text-gray-400 mt-1">
													Jawaban ini akan digunakan
													sebagai acuan penilaian AI
												</p>
											</div>

											{/* Points */}
											<div>
												<label className="block text-sm font-medium text-gray-300 mb-2">
													Poin{" "}
													<span className="text-red-400">
														*
													</span>
												</label>
												<Input
													type="number"
													min="1"
													value={question.points}
													onChange={(e) =>
														handleQuestionChange(
															index,
															"points",
															parseInt(
																e.target.value
															) || 0
														)
													}
													placeholder="10"
													required
												/>
											</div>
										</div>
									</div>
								))}
							</div>
						)}

						{/* Total Score Info */}
						{questions.length > 0 && (
							<div className="mt-6 pt-4 border-t border-gray-700">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-gray-300">
										Total Nilai Maksimal:
									</span>
									<span className="text-xl font-bold text-white">
										{questions.reduce(
											(sum, q) => sum + q.points,
											0
										)}{" "}
										poin
									</span>
								</div>
							</div>
						)}
					</div>

					{/* Action Buttons */}
					<div className="flex gap-4 justify-center">
						<Button
							type="button"
							onClick={handleBack}
							variant="outline"
							size="lg"
						>
							Batal
						</Button>
						<Button
							type="submit"
							variant="primary"
							size="lg"
							className="flex items-center gap-2"
							disabled={updateMutation.isPending}
							isLoading={updateMutation.isPending}
						>
							<FloppyDisk className="w-5 h-5" weight="bold" />
							Simpan Perubahan
						</Button>
					</div>
				</form>
			</main>

			<Footer />
		</div>
	);
}
