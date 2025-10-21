"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { useClassDetail } from "@/hooks/useClasses";
import {
	useClassAssignments,
	useDeleteAssignment,
} from "@/hooks/useAssignments";
import { classService } from "@/services";
import toast from "react-hot-toast";
import {
	ArrowLeft,
	Eye,
	UserPlus,
	DotsThreeVertical,
	Plus,
	CalendarBlank,
	Trash,
	PencilSimple,
	Pencil,
} from "phosphor-react";

export default function ClassDetailPage() {
	return (
		<ProtectedRoute>
			<ClassDetailContent />
		</ProtectedRoute>
	);
}

function ClassDetailContent() {
	const router = useRouter();
	const params = useParams();
	const classId = parseInt(params.id as string);
	const { user } = useAuth();

	const { data: classData, isLoading: isLoadingClass } =
		useClassDetail(classId);
	const { data: assignments, isLoading: isLoadingAssignments } =
		useClassAssignments(classId);
	const deleteAssignment = useDeleteAssignment();

	const [openMenuId, setOpenMenuId] = useState<number | null>(null);
	const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
	const [isDeletingClass, setIsDeletingClass] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const classMenuRef = useRef<HTMLDivElement>(null);

	const isTeacher = user?.id === classData?.teacher_id;

	const handleBack = () => {
		router.push("/dashboard");
	};

	const handleEditClass = () => {
		setIsClassMenuOpen(false);
		router.push(`/kelas/${classId}/edit`);
	};

	const handleDeleteClass = async () => {
		if (!classData) return;

		if (
			!window.confirm(
				`Apakah Anda yakin ingin menghapus kelas "${classData.name}"? Semua data tugas dan peserta akan hilang. Tindakan ini tidak dapat dibatalkan.`
			)
		) {
			return;
		}

		setIsDeletingClass(true);
		setIsClassMenuOpen(false);

		try {
			await classService.deleteClass(classId);
			toast.success("Kelas berhasil dihapus!");
			router.push("/dashboard");
		} catch (error: any) {
			console.error("Error deleting class:", error);
			toast.error(
				error.response?.data?.detail || "Gagal menghapus kelas"
			);
			setIsDeletingClass(false);
		}
	};

	const getAssignmentColor = (index: number) => {
		return index % 2 === 0
			? "bg-gradient-to-br from-yellow-600 to-yellow-700"
			: "bg-gradient-to-br from-blue-700 to-blue-800";
	};

	const handleDeleteAssignment = async (
		assignmentId: number,
		assignmentTitle: string
	) => {
		if (
			window.confirm(
				`Apakah Anda yakin ingin menghapus tugas "${assignmentTitle}"?`
			)
		) {
			try {
				await deleteAssignment.mutateAsync(assignmentId);
				setOpenMenuId(null);
			} catch (error) {
				console.error("Error deleting assignment:", error);
			}
		}
	};

	const handleEditAssignment = (assignmentId: number) => {
		router.push(
			`/kelas/${classId}/tugas/baru?assignmentId=${assignmentId}`
		);
		setOpenMenuId(null);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				setOpenMenuId(null);
			}
			if (
				classMenuRef.current &&
				!classMenuRef.current.contains(event.target as Node)
			) {
				setIsClassMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	if (isLoadingClass || isLoadingAssignments) {
		return (
			<div className="min-h-screen flex flex-col bg-[#2b2d31]">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<LoadingSpinner size="lg" text="Memuat data kelas..." />
				</div>
				<Footer />
			</div>
		);
	}

	if (!classData) {
		return (
			<div className="min-h-screen flex flex-col bg-[#2b2d31]">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<h2 className="text-xl font-semibold text-white mb-2">
							Kelas tidak ditemukan
						</h2>
						<Button onClick={handleBack}>Kembali ke Beranda</Button>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col bg-[#2b2d31]">
			<Navbar />

			<main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
						<div className="flex items-center gap-3 sm:gap-4 flex-1">
							<button
								onClick={handleBack}
								className="text-white hover:text-gray-300 transition-colors"
							>
								<ArrowLeft
									className="w-5 h-5 sm:w-6 sm:h-6"
									weight="bold"
								/>
							</button>
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<h1 className="text-2xl sm:text-3xl font-bold text-white">
										{classData.name}
									</h1>
									{isTeacher && (
										<div className="relative" ref={classMenuRef}>
											<button
												onClick={() =>
													setIsClassMenuOpen(!isClassMenuOpen)
												}
												disabled={isDeletingClass}
												className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors disabled:opacity-50"
											>
												<DotsThreeVertical
													className="w-5 h-5"
													weight="bold"
												/>
											</button>
											{isClassMenuOpen && (
												<div className="absolute left-0 top-full mt-2 w-48 bg-[#1e1f22] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
													<button
														onClick={handleEditClass}
														className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
													>
														<Pencil
															className="w-4 h-4"
															weight="bold"
														/>
														<span>Edit Kelas</span>
													</button>
													<button
														onClick={handleDeleteClass}
														disabled={isDeletingClass}
														className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-3 disabled:opacity-50"
													>
														<Trash
															className="w-4 h-4"
															weight="bold"
														/>
														<span>
															{isDeletingClass
																? "Menghapus..."
																: "Hapus Kelas"}
														</span>
													</button>
												</div>
											)}
										</div>
									)}
								</div>
								<p className="text-sm text-gray-400 mt-1">
									{classData.teacher_name}
								</p>
							</div>
						</div>

						{isTeacher && (
							<div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
								<Button
									onClick={() =>
										router.push(`/kelas/${classId}/peserta`)
									}
									size="sm"
									className="flex items-center gap-2 flex-1 sm:flex-none text-xs sm:text-sm !bg-gray-700 hover:bg-gray-500 !text-white"
								>
									<Eye
										className="w-4 h-4 sm:w-5 sm:h-5 !text-white"
										weight="bold"
									/>
									<span className="hidden sm:inline">
										Lihat Peserta
									</span>
									<span className="sm:hidden">Peserta</span>
								</Button>
								<Button
									onClick={() =>
										router.push(
											`/kelas/${classId}/undang-peserta`
										)
									}
									variant="primary"
									size="sm"
									className="flex items-center gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
								>
									<UserPlus
										className="w-4 h-4 sm:w-5 sm:h-5"
										weight="bold"
									/>
									<span className="hidden sm:inline">
										Undang Peserta
									</span>
									<span className="sm:hidden">Undang</span>
								</Button>
							</div>
						)}
					</div>

					{classData.description && (
						<p className="text-gray-300 text-sm sm:text-base">
							{classData.description}
						</p>
					)}
				</div>

				<div className="mb-6">
					<h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
						Penilaian
					</h2>

					{/* Assignment Cards Grid */}
					<div className="space-y-3 sm:space-y-4">
						{assignments && assignments.length > 0 ? (
							<>
								{assignments.map((assignment, index) => (
									<div
										key={assignment.id}
										className={`${getAssignmentColor(
											index
										)} rounded-xl p-3 sm:p-4 flex items-center justify-between transition-all hover:scale-[1.01] shadow-lg cursor-pointer relative`}
										onClick={() =>
											router.push(
												`/kelas/${classId}/tugas/${assignment.id}`
											)
										}
									>
										<div className="flex items-center gap-3 sm:gap-4">
											<div className="flex items-center gap-2 sm:gap-3">
												<CalendarBlank
													className="w-4 h-4 sm:w-5 sm:h-5 text-white/80"
													weight="bold"
												/>
												<div>
													<h3 className="text-base sm:text-lg font-bold !text-white">
														{assignment.title}
													</h3>
													<p className="text-xs sm:text-sm text-white/80">
														{assignment.deadline
															? `Deadline: ${new Date(
																	assignment.deadline
															  ).toLocaleDateString(
																	"id-ID",
																	{
																		day: "numeric",
																		month: "long",
																		year: "numeric",
																	}
															  )}`
															: "Tidak ada deadline"}
													</p>
												</div>
											</div>
										</div>

										{isTeacher && (
											<div className="relative">
												<button
													onClick={(e) => {
														e.stopPropagation();
														setOpenMenuId(
															openMenuId ===
																assignment.id
																? null
																: assignment.id
														);
													}}
													className="!text-white hover:bg-white/20 rounded-full p-1.5 sm:p-2 transition-colors"
												>
													<DotsThreeVertical
														className="w-5 h-5"
														weight="bold"
													/>
												</button>

												{/* Dropdown Menu */}
												{openMenuId ===
													assignment.id && (
													<div
														ref={menuRef}
														className="absolute right-0 top-full mt-2 w-48 bg-[#1e1f22] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
														onClick={(e) =>
															e.stopPropagation()
														}
													>
														<button
															onClick={(e) => {
																e.stopPropagation();
																handleEditAssignment(
																	assignment.id
																);
															}}
															className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
														>
															<PencilSimple
																className="w-5 h-5"
																weight="bold"
															/>
															<span>
																Edit Tugas
															</span>
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation();
																handleDeleteAssignment(
																	assignment.id,
																	assignment.title
																);
															}}
															className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-3"
														>
															<Trash
																className="w-5 h-5"
																weight="bold"
															/>
															<span>
																Hapus Tugas
															</span>
														</button>
													</div>
												)}
											</div>
										)}
									</div>
								))}
							</>
						) : (
							<div className="text-center py-8 text-gray-400">
								Belum ada tugas untuk kelas ini
							</div>
						)}

						{/* Add New Assignment Button - Only for Teachers */}
						{isTeacher && (
							<button
								onClick={() =>
									router.push(`/kelas/${classId}/tugas/baru`)
								}
								className="w-full border-2 border-dashed border-gray-600 hover:border-gray-500 bg-white dark:bg-gray-950 rounded-xl p-4 sm:p-6 flex items-center justify-center gap-2 sm:gap-3 transition-all hover:bg-gray-white group"
							>
								<Plus
									className="w-5 h-5 sm:w-6 sm:h-6 !text-white group-hover:text-gray-300"
									weight="bold"
								/>
								<span className="text-sm sm:text-base !text-white group-hover:text-gray-300 font-medium">
									Tambah Penilaian Baru
								</span>
							</button>
						)}
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}
