"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { useAssignmentDetail } from "@/hooks/useAssignments";
import {
	useAssignmentStatistics,
	useAssignmentGrades,
	useAutoGradeAllSubmissions,
} from "@/hooks/useGrading";
import toast from "react-hot-toast";
import { ArrowLeft, Books, DotsThreeVertical, Play } from "phosphor-react";

export default function HasilPenilaianPage() {
	return (
		<ProtectedRoute>
			<HasilPenilaianContent />
		</ProtectedRoute>
	);
}

function HasilPenilaianContent() {
	const router = useRouter();
	const params = useParams();
	const classId = parseInt(params.id as string);
	const assignmentId = parseInt(params.tugasId as string);
	const { user } = useAuth();

	const { data: assignmentData, isLoading: isLoadingAssignment } =
		useAssignmentDetail(assignmentId);
	const { data: statistics, isLoading: isLoadingStatistics } =
		useAssignmentStatistics(assignmentId);
	const { data: grades, isLoading: isLoadingGrades } =
		useAssignmentGrades(assignmentId);
	const autoGradeAll = useAutoGradeAllSubmissions();

	// Redirect if user is not a teacher
	useEffect(() => {
		if (user && user.user_role !== "dosen") {
			toast.error("Hanya dosen yang dapat melihat hasil penilaian");
			router.push(`/kelas/${classId}`);
		}
	}, [user, router, classId]);

	const handleBack = () => {
		router.push(`/kelas/${classId}`);
	};

	const handleDetail = (gradeId: number) => {
		router.push(
			`/kelas/${classId}/tugas/${assignmentId}/hasil-penilaian/${gradeId}`
		);
	};

	const handleAutoGradeAll = async () => {
		if (
			window.confirm(
				"Apakah Anda yakin ingin menilai semua jawaban secara otomatis?"
			)
		) {
			try {
				await autoGradeAll.mutateAsync(assignmentId);
			} catch (error) {
				console.error("Error auto-grading:", error);
			}
		}
	};

	// Show access denied message for non-teachers
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
							Hanya dosen yang dapat melihat hasil penilaian
						</p>
						<Button
							onClick={() =>
								router.push(`/kelas/${classId}/tugas`)
							}
						>
							Kembali ke Daftar Tugas
						</Button>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	if (isLoadingAssignment || isLoadingStatistics || isLoadingGrades) {
		return (
			<div className="min-h-screen flex flex-col bg-[#2b2d31]">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<LoadingSpinner size="lg" text="Memuat data penilaian..." />
				</div>
				<Footer />
			</div>
		);
	}

	if (!assignmentData || !statistics || !grades) {
		return (
			<div className="min-h-screen flex flex-col bg-[#2b2d31]">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<h2 className="text-xl font-semibold text-white mb-2">
							Data tidak ditemukan
						</h2>
						<Button onClick={handleBack}>Kembali</Button>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	const totalStudents = statistics.total_students;
	const totalSubmissions = statistics.total_submissions;
	const gradedStudents = statistics.graded_submissions;
	const passedStudents = statistics.passed_students;
	const failedStudents = statistics.failed_students;
	const passPercentage = Math.round(statistics.pass_percentage);
	const minimalScore = statistics.minimal_score;

	return (
		<div className="min-h-screen flex flex-col bg-[#2b2d31]">
			<Navbar />

			<main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<div className="flex items-center justify-between mb-4 sm:mb-6">
						<div className="flex items-center gap-3 sm:gap-4">
							<button
								onClick={handleBack}
								className="text-white hover:text-gray-300 transition-colors"
							>
								<ArrowLeft
									className="w-5 h-5 sm:w-6 sm:h-6"
									weight="bold"
								/>
							</button>
							<div className="flex items-center gap-2 sm:gap-3">
								<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 flex items-center justify-center">
									<Books
										className="w-5 h-5 sm:w-6 sm:h-6 text-white"
										weight="bold"
									/>
								</div>
								<div>
									<h1 className="text-2xl sm:text-3xl font-bold text-white">
										Hasil Penilaian
									</h1>
									<p className="text-sm text-gray-400 mt-1">
										{assignmentData.title}
									</p>
								</div>
							</div>
						</div>

						<Button
							onClick={handleAutoGradeAll}
							variant="primary"
							size="sm"
							className="flex items-center gap-2"
							disabled={autoGradeAll.isPending}
						>
							<Play className="w-4 h-4" weight="bold" />
							{autoGradeAll.isPending
								? "Menilai..."
								: "Nilai Semua"}
						</Button>
					</div>
				</div>

				{/* Statistik Section */}
				<div className="mb-6 sm:mb-8">
					<h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
						Statistik
					</h2>

					{/* Submission Count Header */}
					<div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-4 mb-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-white text-lg font-semibold">
									Pengumpulan Tugas
								</h3>
								<p className="text-gray-400 text-sm mt-1">
									{totalSubmissions} dari {totalStudents}{" "}
									mahasiswa sudah mengumpulkan
								</p>
							</div>
							<div className="text-right">
								<div className="text-3xl font-bold text-white">
									{totalSubmissions}/{totalStudents}
								</div>
								<p className="text-gray-400 text-sm">
									(
									{totalStudents > 0
										? Math.round(
												(totalSubmissions /
													totalStudents) *
													100
										  )
										: 0}
									%)
								</p>
							</div>
						</div>
					</div>

					<div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-4 sm:p-6 lg:p-8">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
							{/* Bar Chart - Kelulusan */}
							<div>
								<h3 className="text-sm sm:text-base text-white font-semibold text-center mb-4 sm:mb-6">
									Kelulusan
								</h3>
								<div className="flex items-end justify-center gap-8 sm:gap-12 h-48 sm:h-64">
									{/* Lulus Bar */}
									<div className="flex flex-col items-center">
										<div
											className="w-16 sm:w-24 bg-green-500 rounded-t-lg relative"
											style={{
												height:
													gradedStudents > 0
														? `${
																(passedStudents /
																	gradedStudents) *
																100 *
																1.8
														  }px`
														: "0px",
												maxHeight: "180px",
											}}
										>
											<div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 text-sm sm:text-base text-white font-semibold">
												{passedStudents}
											</div>
										</div>
										<div className="mt-2 sm:mt-3 text-xs sm:text-base text-gray-400 font-medium">
											Lulus
										</div>
									</div>

									{/* Tidak Lulus Bar */}
									<div className="flex flex-col items-center">
										<div
											className="w-16 sm:w-24 bg-red-500 rounded-t-lg relative"
											style={{
												height:
													gradedStudents > 0
														? `${
																(failedStudents /
																	gradedStudents) *
																100 *
																1.8
														  }px`
														: "0px",
												maxHeight: "180px",
											}}
										>
											<div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 text-sm sm:text-base text-white font-semibold">
												{failedStudents}
											</div>
										</div>
										<div className="mt-2 sm:mt-3 text-xs sm:text-base text-gray-400 font-medium">
											Tidak Lulus
										</div>
									</div>
								</div>
							</div>

							{/* Donut Chart - Persentase Kelulusan */}
							<div>
								<h3 className="text-sm sm:text-base text-white font-semibold text-center mb-4 sm:mb-6">
									Persentase Kelulusan
								</h3>
								<div className="flex items-center justify-center h-48 sm:h-64">
									<div className="relative w-36 h-36 sm:w-48 sm:h-48">
										{/* SVG Donut Chart */}
										<svg
											className="w-full h-full -rotate-90"
											viewBox="0 0 100 100"
										>
											{/* Background Circle */}
											<circle
												cx="50"
												cy="50"
												r="40"
												fill="none"
												stroke="#4a4d52"
												strokeWidth="12"
											/>
											{/* Progress Circle - Lulus (Green) */}
											<circle
												cx="50"
												cy="50"
												r="40"
												fill="none"
												stroke="#22c55e"
												strokeWidth="12"
												strokeDasharray={`${
													passPercentage * 2.51
												} ${
													251 - passPercentage * 2.51
												}`}
												strokeLinecap="round"
											/>
										</svg>
										{/* Percentage Text */}
										<div className="absolute inset-0 flex items-center justify-center">
											<span className="text-3xl sm:text-4xl font-bold text-white">
												{passPercentage}%
											</span>
										</div>
									</div>
								</div>
								{/* Legend */}
								<div className="flex items-center justify-center gap-6 sm:gap-8 mt-4 sm:mt-6">
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
										<span className="text-gray-300 text-xs sm:text-sm">
											Lulus
										</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-500 rounded"></div>
										<span className="text-gray-300 text-xs sm:text-sm">
											Tidak Lulus
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Statistics Summary */}
						<div className="mt-6 pt-6 border-t border-gray-700">
							<div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
								<div className="text-center">
									<p className="text-gray-400 text-xs sm:text-sm mb-1">
										Total Submisi
									</p>
									<p className="text-white text-xl sm:text-2xl font-bold">
										{totalSubmissions}
									</p>
								</div>
								<div className="text-center">
									<p className="text-gray-400 text-xs sm:text-sm mb-1">
										Dinilai
									</p>
									<p className="text-white text-xl sm:text-2xl font-bold">
										{gradedStudents}
									</p>
								</div>
								<div className="text-center">
									<p className="text-gray-400 text-xs sm:text-sm mb-1">
										Nilai Minimal
									</p>
									<p className="text-white text-xl sm:text-2xl font-bold">
										{minimalScore}
									</p>
								</div>
								<div className="text-center">
									<p className="text-gray-400 text-xs sm:text-sm mb-1">
										Rata-rata
									</p>
									<p className="text-white text-xl sm:text-2xl font-bold">
										{statistics.average_score?.toFixed(1) ||
											"0"}
									</p>
								</div>
								<div className="text-center">
									<p className="text-gray-400 text-xs sm:text-sm mb-1">
										Tertinggi
									</p>
									<p className="text-white text-xl sm:text-2xl font-bold">
										{statistics.highest_score?.toFixed(1) ||
											"0"}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Nilai Section */}
				<div className="mb-6 sm:mb-8">
					<h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
						Daftar Nilai
					</h2>
					<div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-4 sm:p-6">
						{grades.length > 0 ? (
							<div className="space-y-2 sm:space-y-3">
								{grades.map((grade) => {
									const isPassed =
										grade.total_score >= minimalScore;
									return (
										<div
											key={grade.id}
											className="bg-[#2b2d31] rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
										>
											{/* Student Name */}
											<div className="flex-1 min-w-0 w-full sm:w-auto">
												<p className="text-sm sm:text-base text-white font-medium truncate">
													{grade.student_name}
												</p>
												<p className="text-xs text-gray-400">
													{new Date(
														grade.graded_at
													).toLocaleDateString(
														"id-ID",
														{
															day: "numeric",
															month: "long",
															year: "numeric",
														}
													)}
												</p>
											</div>

											{/* Score Badge and Actions */}
											<div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
												{/* Score Badge */}
												<div
													className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-white text-sm sm:text-base min-w-[60px] sm:min-w-[80px] text-center ${
														isPassed
															? "bg-green-500"
															: "bg-red-500"
													}`}
												>
													{grade.total_score?.toFixed(
														1
													) || 0}
												</div>

												{/* Detail Button */}
												<Button
													onClick={() =>
														handleDetail(grade.submission_id)
													}
													variant="outline"
													size="sm"
													className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
												>
													Detail
												</Button>

												{/* Menu Button */}
												<button
													onClick={() =>
														console.log(
															"Menu",
															grade.id
														)
													}
													className="text-gray-400 hover:text-white transition-colors p-1 sm:p-2"
												>
													<DotsThreeVertical
														className="w-4 h-4 sm:w-5 sm:h-5"
														weight="bold"
													/>
												</button>
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<div className="text-center py-12">
								<p className="text-gray-400">
									Belum ada penilaian
								</p>
							</div>
						)}
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}
