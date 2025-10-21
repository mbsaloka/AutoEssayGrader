"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import Textarea from "@/components/Textarea";
import { useAuth } from "@/context/AuthContext";
import { assignmentService } from "@/services";
import toast from "react-hot-toast";
import {
	ArrowLeft,
	Books,
	CalendarBlank,
	Play,
	CheckCircle,
} from "phosphor-react";
import type { AssignmentDetailResponse, AnswerSubmit } from "@/types";

export default function AssignmentDetailPage() {
	return (
		<ProtectedRoute>
			<AssignmentDetailContent />
		</ProtectedRoute>
	);
}

function AssignmentDetailContent() {
	const router = useRouter();
	const params = useParams();
	const queryClient = useQueryClient();
	const classId = parseInt(params.id as string);
	const assignmentId = parseInt(params.tugasId as string);
	const { user } = useAuth();

	const [answers, setAnswers] = useState<AnswerSubmit[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Fetch assignment details
	const {
		data: assignment,
		isLoading,
		error,
	} = useQuery<AssignmentDetailResponse>({
		queryKey: ["assignment", assignmentId],
		queryFn: () => assignmentService.getAssignmentDetails(assignmentId),
	});

	// Check if student has submitted
	const { data: mySubmission } = useQuery({
		queryKey: ["mySubmission", assignmentId],
		queryFn: () => assignmentService.getMySubmission(assignmentId),
		enabled: user?.user_role === "mahasiswa",
	});

	// Initialize answers state when assignment data loads or when submission changes
	useEffect(() => {
		if (assignment?.questions && assignment.questions.length > 0) {
			// If student has submitted, load their submitted answers
			if (mySubmission?.submitted && mySubmission.answers) {
				const submittedAnswers = assignment.questions.map((q) => {
					const submittedAnswer = mySubmission.answers?.find(
						(a) => a.question_id === q.id
					);
					return {
						question_id: q.id,
						answer_text: submittedAnswer?.answer_text || "",
					};
				});
				setAnswers(submittedAnswers);
			} else {
				// Otherwise, initialize with empty answers
				setAnswers(
					assignment.questions.map((q) => ({
						question_id: q.id,
						answer_text: "",
					}))
				);
			}
		}
	}, [assignment, mySubmission]);

	const handleBack = () => {
		router.push(`/kelas/${classId}`);
	};

	const handleAnswerChange = (questionId: number, text: string) => {
		setAnswers((prev) =>
			prev.map((answer) =>
				answer.question_id === questionId
					? { ...answer, answer_text: text }
					: answer
			)
		);
	};

	const handleSubmit = async () => {
		// Validate: check if all answers are filled
		const emptyAnswers = answers.filter((a) => !a.answer_text.trim());
		if (emptyAnswers.length > 0) {
			toast.error("Mohon isi semua jawaban sebelum mengumpulkan tugas");
			return;
		}

		setIsSubmitting(true);

		try {
			await assignmentService.submitTypedAnswer(assignmentId, {
				answers,
			});
			toast.success("Jawaban berhasil dikumpulkan!");

			// Invalidate queries to refresh submission status
			queryClient.invalidateQueries({
				queryKey: ["mySubmission", assignmentId],
			});
		} catch (err) {
			console.error("Submit error:", err);
			const errorMessage =
				err instanceof Error
					? err.message
					: "Terjadi kesalahan saat mengumpulkan jawaban";
			toast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getAnswerForQuestion = (questionId: number) => {
		return (
			answers.find((a) => a.question_id === questionId)?.answer_text || ""
		);
	};

	// Calculate answered count for progress
	const answeredCount = answers.filter((a) => a.answer_text.trim()).length;
	const totalCount = assignment?.questions?.length || 0;

	const isTeacher = user?.user_role === "dosen";
	const hasSubmitted = mySubmission?.submitted || false;
	const isGraded = mySubmission?.graded || false;

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

	// Skip FILE_BASED assignments for students (as requested)
	if (!isTeacher && assignment.assignment_type === "file_based") {
		return (
			<div className="min-h-screen flex flex-col bg-[#2b2d31]">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<h2 className="text-xl font-semibold text-white mb-2">
							Tipe tugas ini belum didukung
						</h2>
						<p className="text-gray-400 mb-4">
							Tugas berbasis file sedang dalam pengembangan
						</p>
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
										{assignment.title}
									</h1>
									<p className="text-sm text-gray-400 mt-1">
										{assignment.class_name}
									</p>
								</div>
							</div>
						</div>

						{/* Submit Button - Desktop (only for students) */}
						{!isTeacher && !hasSubmitted && (
							<div className="hidden sm:block">
								<Button
									onClick={handleSubmit}
									variant="primary"
									size="md"
									className="flex items-center gap-2"
									disabled={
										answeredCount === 0 || isSubmitting
									}
									isLoading={isSubmitting}
								>
									<Play className="w-5 h-5" weight="bold" />
									Kumpulkan ({answeredCount}/{totalCount})
								</Button>
							</div>
						)}
					</div>

					{/* Submission Status */}
					{!isTeacher && hasSubmitted && (
						<div
							className={`${
								isGraded
									? "bg-blue-900/20 border-blue-700"
									: "bg-green-900/20 border-green-700"
							} border rounded-lg px-4 py-3`}
						>
							<div className="flex items-center gap-2">
								<CheckCircle
									className={`w-5 h-5 ${
										isGraded
											? "text-blue-400"
											: "text-green-400"
									}`}
									weight="bold"
								/>
								<div className="flex-1">
									<p
										className={`${
											isGraded
												? "text-blue-300"
												: "text-green-300"
										} text-sm font-medium`}
									>
										{isGraded
											? `Tugas sudah dinilai. Jawaban tidak bisa diubah.`
											: "Tugas sudah dikumpulkan dan sedang dinilai secara otomatis..."}
									</p>
									{isGraded && (
										<p className="text-blue-400 text-sm font-semibold mt-1">
											Nilai Anda:{" "}
											{mySubmission?.total_score?.toFixed(
												1
											)}
											/{mySubmission?.max_score} (
											{mySubmission?.percentage?.toFixed(
												1
											)}
											%)
										</p>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Progress Info (only for students doing text-based assignments) */}
					{!isTeacher && !hasSubmitted && (
						<div className="bg-blue-900/20 border border-blue-700 rounded-lg px-4 py-3 mb-4">
							<p className="text-blue-300 text-sm">
								Jawab semua pertanyaan di bawah ini. Progress:{" "}
								<span className="font-bold">
									{answeredCount} dari {totalCount} soal
									dijawab
								</span>
							</p>
						</div>
					)}
				</div>

				{/* Description */}
				{assignment.description && (
					<div className="mb-8">
						<h2 className="text-xl font-semibold text-white mb-4">
							Deskripsi
						</h2>
						<div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-6">
							<p className="text-gray-300 leading-relaxed">
								{assignment.description}
							</p>
						</div>
					</div>
				)}

				{/* Assignment Details */}
				<div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-4">
						<div className="flex items-center gap-2 mb-2">
							<CalendarBlank
								className="w-5 h-5 text-gray-400"
								weight="bold"
							/>
							<h3 className="text-sm font-semibold text-gray-400">
								Deadline
							</h3>
						</div>
						<p className="text-white">
							{assignment.deadline
								? new Date(
										assignment.deadline
								  ).toLocaleDateString("id-ID", {
										day: "numeric",
										month: "long",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
								  })
								: "Tidak ada deadline"}
						</p>
					</div>

					<div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-4">
						<div className="flex items-center gap-2 mb-2">
							<Books
								className="w-5 h-5 text-gray-400"
								weight="bold"
							/>
							<h3 className="text-sm font-semibold text-gray-400">
								Tipe
							</h3>
						</div>
						<p className="text-white capitalize">Ketik Manual</p>
					</div>

					<div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-4">
						<div className="flex items-center gap-2 mb-2">
							<CheckCircle
								className="w-5 h-5 text-gray-400"
								weight="bold"
							/>
							<h3 className="text-sm font-semibold text-gray-400">
								Nilai Maksimal
							</h3>
						</div>
						<p className="text-white">
							{assignment.max_score} poin
						</p>
					</div>
				</div>

				{/* Questions Section */}
				{assignment.questions && assignment.questions.length > 0 ? (
					<div className="mb-8">
						<h2 className="text-xl font-semibold text-white mb-4">
							Soal {isTeacher && "dan Kunci Jawaban"}
						</h2>

						{assignment.questions
							.sort((a, b) => a.question_order - b.question_order)
							.map((question, index) => (
								<div key={question.id} className="mb-8">
									{/* Question */}
									<div className="mb-4">
										<h3 className="text-lg font-semibold text-white mb-3">
											Soal {index + 1} ({question.points}{" "}
											poin)
										</h3>
										<div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-6">
											<p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
												{question.question_text}
											</p>
										</div>
									</div>

									{/* Teacher View: Show Reference Answer */}
									{isTeacher && (
										<div>
											<h3 className="text-lg font-semibold text-white mb-3">
												Kunci Jawaban:
											</h3>
											<div className="bg-[#1e1f22] border border-green-700/50 rounded-xl p-6">
												<p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
													{question.reference_answer}
												</p>
											</div>
										</div>
									)}

									{/* Student View: Show Answer Input/View */}
									{!isTeacher && (
										<div>
											<h3 className="text-lg font-semibold text-white mb-3">
												Jawaban Anda:
											</h3>

											{/* Show textarea (editable if not submitted, read-only if submitted) */}
											<Textarea
												value={getAnswerForQuestion(
													question.id
												)}
												onChange={(e) =>
													handleAnswerChange(
														question.id,
														e.target.value
													)
												}
												placeholder={
													hasSubmitted
														? "Tidak ada jawaban"
														: `Ketik jawaban untuk Soal ${
																index + 1
														  } di sini...`
												}
												rows={8}
												className="w-full"
												disabled={hasSubmitted}
												readOnly={hasSubmitted}
											/>

											<div className="flex justify-between items-center mt-2">
												<span className="text-sm text-gray-400">
													{
														getAnswerForQuestion(
															question.id
														).length
													}{" "}
													karakter
												</span>

												{/* Show score if graded */}
												{isGraded &&
													mySubmission?.answers && (
														<span className="text-sm font-medium text-blue-400">
															Nilai:{" "}
															{mySubmission.answers
																.find(
																	(a) =>
																		a.question_id ===
																		question.id
																)
																?.final_score?.toFixed(
																	1
																) || 0}
															/{question.points}
														</span>
													)}
											</div>

											{/* Show feedback if graded */}
											{isGraded &&
												mySubmission?.answers?.find(
													(a) =>
														a.question_id ===
														question.id
												)?.feedback && (
													<div className="mt-3 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
														<h4 className="text-sm font-semibold text-blue-300 mb-2">
															Feedback dari AI:
														</h4>
														<p className="text-gray-300 text-sm whitespace-pre-wrap">
															{
																mySubmission.answers.find(
																	(a) =>
																		a.question_id ===
																		question.id
																)?.feedback
															}
														</p>
													</div>
												)}
										</div>
									)}

									{/* Divider */}
									{index <
										(assignment.questions?.length || 0) -
											1 && (
										<div className="border-t border-gray-700 mt-8"></div>
									)}
								</div>
							))}
					</div>
				) : (
					<div className="text-center py-12">
						<p className="text-gray-400">
							Belum ada soal untuk tugas ini
						</p>
					</div>
				)}

				{/* Submit Button - Mobile (only for students) */}
				{!isTeacher && !hasSubmitted && (
					<div className="sm:hidden flex justify-center mt-8">
						<Button
							onClick={handleSubmit}
							variant="primary"
							size="lg"
							className="w-full flex items-center justify-center gap-2"
							disabled={answeredCount === 0 || isSubmitting}
							isLoading={isSubmitting}
						>
							<Play className="w-5 h-5" weight="bold" />
							Kumpulkan ({answeredCount}/{totalCount})
						</Button>
					</div>
				)}

				{/* Student - View Grade Details Button (when graded) */}
				{!isTeacher && isGraded && mySubmission?.submission_id && (
					<div className="flex justify-center mt-8">
						<Button
							onClick={() =>
								router.push(
									`/kelas/${classId}/tugas/${assignmentId}/hasil-penilaian/${mySubmission.submission_id}`
								)
							}
							variant="primary"
							size="lg"
							className="flex items-center gap-2"
						>
							<CheckCircle className="w-5 h-5" weight="bold" />
							Lihat Detail Nilai
						</Button>
					</div>
				)}

				{/* Teacher Actions */}
				{isTeacher && (
					<div className="flex gap-4 justify-center mt-8">
						<Button
							onClick={() =>
								router.push(
									`/kelas/${classId}/tugas/${assignmentId}/hasil-penilaian`
								)
							}
							variant="primary"
							size="md"
						>
							Lihat Semua Hasil Penilaian
						</Button>
					</div>
				)}
			</main>

			<Footer />
		</div>
	);
}
