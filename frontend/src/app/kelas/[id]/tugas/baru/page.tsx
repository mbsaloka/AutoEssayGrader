"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import {
	useCreateAssignment,
	useUpdateAssignment,
	useAssignmentDetail,
} from "@/hooks/useAssignments";
import toast from "react-hot-toast";
import {
	ArrowLeft,
	Books,
	CalendarBlank,
	Clock,
	Plus,
	Trash,
} from "phosphor-react";

interface QuestionData {
	id?: number;
	question_text: string;
	reference_answer: string;
	points: number;
}

export default function NewAssignmentPage() {
	return (
		<ProtectedRoute>
			<NewAssignmentContent />
		</ProtectedRoute>
	);
}

function NewAssignmentContent() {
	const router = useRouter();
	const params = useParams();
	const searchParams = useSearchParams();
	const classId = parseInt(params.id as string);
	const assignmentIdParam = searchParams.get("assignmentId");
	const assignmentId = assignmentIdParam ? parseInt(assignmentIdParam) : null;
	const { user } = useAuth();

	const isEditMode = !!assignmentId;

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [questions, setQuestions] = useState<QuestionData[]>([
		{ question_text: "", reference_answer: "", points: 10 },
	]);
	const [deadline, setDeadline] = useState("");
	const [deadlineTime, setDeadlineTime] = useState("");
	const [maxScore, setMaxScore] = useState("");
	const [minimalScore, setMinimalScore] = useState("75");

	const createAssignment = useCreateAssignment();
	const updateAssignment = useUpdateAssignment();
	const { data: assignmentData, isLoading: isLoadingAssignment } =
		useAssignmentDetail(assignmentId || 0);

	useEffect(() => {
		if (user && user.user_role !== "dosen") {
			toast.error("Hanya dosen yang dapat membuat atau mengedit tugas");
			router.push(`/kelas/${classId}`);
		}
	}, [user, router, classId]);

	useEffect(() => {
		if (isEditMode && assignmentData) {
			if (
				assignmentData.submission_count &&
				assignmentData.submission_count > 0
			) {
				toast.error(
					`Tidak dapat mengedit tugas. Sudah ada ${assignmentData.submission_count} mahasiswa yang mengumpulkan.`
				);
				router.push(`/kelas/${classId}/tugas/${assignmentId}`);
				return;
			}

			setTitle(assignmentData.title);
			setDescription(assignmentData.description || "");

			if (
				assignmentData.questions &&
				Array.isArray(assignmentData.questions)
			) {
				const loadedQuestions = assignmentData.questions.map(
					(q: {
						id: number;
						question_text: string;
						reference_answer: string;
						points: number;
					}) => ({
						id: q.id,
						question_text: q.question_text || "",
						reference_answer: q.reference_answer || "",
						points: q.points || 10,
					})
				);
				setQuestions(
					loadedQuestions.length > 0
						? loadedQuestions
						: [
								{
									question_text: "",
									reference_answer: "",
									points: 10,
								},
						  ]
				);
			}

			setMaxScore(assignmentData.max_score?.toString() || "");
			setMinimalScore(assignmentData.minimal_score?.toString() || "75");

			if (assignmentData.deadline) {
				const deadlineDate = new Date(assignmentData.deadline);
				setDeadline(deadlineDate.toISOString().split("T")[0]);
				setDeadlineTime(
					deadlineDate.toTimeString().split(" ")[0].substring(0, 5)
				);
			}
		}
	}, [isEditMode, assignmentData, router, classId, assignmentId]);

	useEffect(() => {
		const total = questions.reduce((sum, q) => sum + (q.points || 0), 0);
		setMaxScore(total.toString());
	}, [questions]);

	const handleBack = () => {
		router.push(`/kelas/${classId}`);
	};

	const handleAddQuestion = () => {
		setQuestions([
			...questions,
			{ question_text: "", reference_answer: "", points: 10 },
		]);
	};

	const handleRemoveQuestion = (index: number) => {
		if (questions.length === 1) {
			toast.error("Minimal harus ada 1 soal");
			return;
		}
		const newQuestions = questions.filter((_, i) => i !== index);
		setQuestions(newQuestions);
	};

	const handleQuestionChange = (
		index: number,
		field: keyof QuestionData,
		value: string | number
	) => {
		const newQuestions = [...questions];
		newQuestions[index] = { ...newQuestions[index], [field]: value };
		setQuestions(newQuestions);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!title.trim()) {
			toast.error("Judul tugas harus diisi");
			return;
		}

		const hasEmptyQuestions = questions.some(
			(q) => !q.question_text.trim() || !q.reference_answer.trim()
		);
		if (hasEmptyQuestions) {
			toast.error("Semua soal dan kunci jawaban harus diisi");
			return;
		}

		if (questions.length === 0) {
			toast.error("Minimal harus ada 1 soal");
			return;
		}

		let deadlineValue: string | undefined = undefined;
		if (deadline) {
			if (deadlineTime) {
				deadlineValue = `${deadline}T${deadlineTime}:00`;
			} else {
				deadlineValue = `${deadline}T23:59:59`;
			}
		}

		const formattedQuestions = questions.map((q, index) => ({
			id: q.id,
			question_text: q.question_text,
			reference_answer: q.reference_answer,
			points: q.points,
			question_order: index + 1,
		}));

		try {
			if (isEditMode && assignmentId) {
				await updateAssignment.mutateAsync({
					assignmentId,
					data: {
						title,
						description: description || undefined,
						questions: formattedQuestions,
						deadline: deadlineValue,
						max_score: parseInt(maxScore) || undefined,
						minimal_score: parseInt(minimalScore) || 75,
					},
				});
				toast.success("Tugas berhasil diperbarui!");
			} else {
				await createAssignment.mutateAsync({
					kelas_id: classId,
					title,
					description: description || undefined,
					questions: formattedQuestions,
					deadline: deadlineValue,
					max_score: parseInt(maxScore) || undefined,
					minimal_score: parseInt(minimalScore) || 75,
				});
				toast.success("Tugas berhasil dibuat!");
			}
			router.push(`/kelas/${classId}`);
		} catch (error: any) {
			console.error("Error saving assignment:", error);

			if (
				error?.response?.data?.detail &&
				error.response.data.detail.includes("submission")
			) {
				toast.error(error.response.data.detail);
				router.push(`/kelas/${classId}/tugas/${assignmentId}`);
			} else {
				toast.error(
					isEditMode
						? "Gagal memperbarui tugas"
						: "Gagal membuat tugas"
				);
			}
		}
	};

	if (user && user.user_role !== "dosen") {
		return (
			<div className="min-h-screen flex flex-col bg-[#2b2d31]">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<h2 className="text-xl font-semibold text-white mb-2">
							Akses Ditolak
						</h2>
						<p className="text-gray-400 mb-4">
							Hanya dosen yang dapat membuat atau mengedit tugas
						</p>
						<Button
							onClick={() => router.push(`/kelas/${classId}`)}
						>
							Kembali ke Kelas
						</Button>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	if (isEditMode && isLoadingAssignment) {
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

	return (
		<div className="min-h-screen flex flex-col bg-[#2b2d31]">
			<Navbar />

			<main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<div className="flex items-center gap-3 sm:gap-4 mb-6">
						<button
							onClick={handleBack}
							className="text-white hover:text-gray-300 transition-colors"
						>
							<ArrowLeft
								className="w-5 h-5 sm:w-6 sm:h-6"
								weight="bold"
							/>
						</button>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 flex items-center justify-center">
								<Books
									className="w-5 h-5 sm:w-6 sm:h-6 text-white"
									weight="bold"
								/>
							</div>
							<h1 className="text-2xl sm:text-3xl font-bold text-white">
								{isEditMode ? "Edit Tugas" : "Buat Tugas Baru"}
							</h1>
						</div>
					</div>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Judul Tugas */}
					<div>
						<label className="block text-white text-base sm:text-lg font-semibold mb-3">
							Judul Tugas
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Masukkan judul tugas"
							className="w-full px-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
							required
						/>
					</div>

					{/* Deskripsi */}
					<div>
						<label className="block text-white text-base sm:text-lg font-semibold mb-3">
							Deskripsi (Opsional)
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Masukkan deskripsi tugas"
							rows={4}
							className="w-full px-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors resize-none"
						/>
					</div>

					{/* Soal dan Kunci Jawaban */}
					<div>
						<h2 className="text-white text-base sm:text-lg font-semibold mb-4">
							Soal dan Kunci Jawaban
						</h2>
						<div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-4 sm:p-6">
							{questions.map((question, index) => (
								<div key={index} className="mb-6 last:mb-0">
									<div className="flex items-center justify-between mb-3">
										<h3 className="text-white font-semibold">
											Soal {index + 1}
										</h3>
										{questions.length > 1 && (
											<button
												type="button"
												onClick={() =>
													handleRemoveQuestion(index)
												}
												className="text-red-400 hover:text-red-300 transition-colors p-1"
												title="Hapus soal"
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
											<label className="block text-sm text-gray-400 mb-2">
												Pertanyaan
											</label>
											<textarea
												value={question.question_text}
												onChange={(e) =>
													handleQuestionChange(
														index,
														"question_text",
														e.target.value
													)
												}
												placeholder="Masukkan pertanyaan"
												rows={3}
												className="w-full px-4 py-3 bg-[#2b2d31] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors resize-none"
												required
											/>
										</div>

										{/* Reference Answer */}
										<div>
											<label className="block text-sm text-gray-400 mb-2">
												Kunci Jawaban
											</label>
											<textarea
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
												className="w-full px-4 py-3 bg-[#2b2d31] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors resize-none"
												required
											/>
										</div>

										{/* Points */}
										<div>
											<label className="block text-sm text-gray-400 mb-2">
												Poin
											</label>
											<input
												type="number"
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
												min="1"
												max="1000"
												className="w-full px-4 py-3 bg-[#2b2d31] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gray-500 transition-colors"
												required
											/>
										</div>
									</div>

									{/* Divider */}
									{index < questions.length - 1 && (
										<div className="border-t border-gray-700 mt-6"></div>
									)}
								</div>
							))}

							{/* Add Question Button */}
							<div className="mt-6 pt-6 border-t border-gray-700">
								<button
									type="button"
									onClick={handleAddQuestion}
									className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
								>
									<Plus className="w-5 h-5" weight="bold" />
									Tambah Soal
								</button>
							</div>
						</div>
						<p className="text-sm text-gray-400 mt-2">
							Setiap soal akan dinilai secara otomatis berdasarkan
							kunci jawaban yang Anda berikan.
						</p>
					</div>

					{/* Deadline */}
					<div>
						<label className="block text-white text-base sm:text-lg font-semibold mb-3">
							Deadline (Opsional)
						</label>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="relative">
								<CalendarBlank
									className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
									weight="bold"
								/>
								<input
									type="date"
									value={deadline}
									onChange={(e) =>
										setDeadline(e.target.value)
									}
									className="w-full pl-10 pr-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gray-500 transition-colors"
								/>
							</div>
							<div className="relative">
								<Clock
									className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
									weight="bold"
								/>
								<input
									type="time"
									value={deadlineTime}
									onChange={(e) =>
										setDeadlineTime(e.target.value)
									}
									className="w-full pl-10 pr-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gray-500 transition-colors"
								/>
							</div>
						</div>
					</div>

					{/* Max Score - Auto calculated */}
					<div>
						<label className="block text-white text-base sm:text-lg font-semibold mb-3">
							Skor Maksimal
						</label>
						<div className="w-full px-4 py-3 bg-[#2b2d31] border border-gray-600 rounded-xl text-white">
							<div className="flex items-center justify-between">
								<span className="text-gray-400">
									Total Poin dari Semua Soal:
								</span>
								<span className="text-2xl font-bold text-yellow-400">
									{maxScore || 0}
								</span>
							</div>
						</div>
						<p className="text-sm text-gray-400 mt-2">
							Skor maksimal dihitung otomatis dari jumlah poin
							semua soal.
						</p>
					</div>

					{/* Minimal Score for Passing */}
					<div>
						<label className="block text-white text-base sm:text-lg font-semibold mb-3">
							Nilai Minimal Kelulusan
						</label>
						<input
							type="number"
							value={minimalScore}
							onChange={(e) => setMinimalScore(e.target.value)}
							min="0"
							max={maxScore || "100"}
							placeholder="75"
							className="w-full px-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
							required
						/>
						<p className="text-sm text-gray-400 mt-2">
							Mahasiswa yang mendapat nilai di atas atau sama
							dengan nilai minimal ini akan dinyatakan lulus.
						</p>
					</div>

					{/* Submit Button */}
					<div className="flex justify-center gap-4 pt-4">
						<Button
							type="button"
							onClick={handleBack}
							variant="outline"
							size="lg"
							className="min-w-[150px]"
						>
							Batal
						</Button>
						<Button
							type="submit"
							variant="primary"
							size="lg"
							className="min-w-[150px]"
							disabled={
								createAssignment.isPending ||
								updateAssignment.isPending
							}
						>
							{createAssignment.isPending ||
							updateAssignment.isPending
								? "Menyimpan..."
								: isEditMode
								? "Perbarui Tugas"
								: "Buat Tugas"}
						</Button>
					</div>
				</form>
			</main>

			<Footer />
		</div>
	);
}
