"use client";

import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import { useClassDetail, useRemoveParticipant } from "@/hooks/useClasses";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Books, Trash, User } from "phosphor-react";

export default function PesertaPage() {
	return (
		<ProtectedRoute>
			<PesertaContent />
		</ProtectedRoute>
	);
}

function PesertaContent() {
	const router = useRouter();
	const params = useParams();
	const classId = parseInt(params.id as string);
	const { user } = useAuth();

	const { data: classData, isLoading } = useClassDetail(classId);
	const removeParticipant = useRemoveParticipant();

	const handleBack = () => {
		router.push(`/kelas/${classId}`);
	};

	const handleRemoveParticipant = async (
		userId: number,
		userName: string
	) => {
		if (
			window.confirm(
				`Apakah Anda yakin ingin menghapus ${userName} dari kelas ini?`
			)
		) {
			try {
				await removeParticipant.mutateAsync({ classId, userId });
			} catch (error) {
				console.error("Error removing participant:", error);
			}
		}
	};

	const isTeacher = user?.id === classData?.teacher_id;

	if (isLoading) {
		return (
			<div className="min-h-screen flex flex-col bg-[#2b2d31]">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<LoadingSpinner size="lg" text="Memuat data peserta..." />
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
						<Button onClick={() => router.push("/kelas")}>
							Kembali ke Kelas
						</Button>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	const participants = classData.participants || [];

	return (
		<div className="min-h-screen flex flex-col bg-[#2b2d31]">
			<Navbar />
			<main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				<div className="mb-6 sm:mb-8">
					<div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
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
									{classData.name}
								</h1>
								<p className="text-sm text-gray-400 mt-1">
									{classData.teacher_name}
								</p>
							</div>
						</div>
					</div>
				</div>
				<div>
					<h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
						Peserta ({participants.length})
					</h2>
					<div className="space-y-2 sm:space-y-3">
						{participants.map((participant) => (
							<div
								key={participant.id}
								className="!bg-slate-800 border border-white rounded-xl px-4 sm:px-6 py-3 sm:py-4 transition-all hover:bg-gray-800/50 dark:hover:border-gray-800 flex items-center justify-between"
							>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
										<User
											className="w-5 h-5 text-white"
											weight="bold"
										/>
									</div>
									<div>
										<p className="text-sm sm:text-base !text-white font-medium">
											{participant.fullname}
										</p>
										<p className="text-xs text-gray-400">
											{participant.email}
										</p>
									</div>
								</div>
								{isTeacher &&
									participant.user_id !==
										classData.teacher_id && (
										<button
											onClick={() =>
												handleRemoveParticipant(
													participant.user_id,
													participant.fullname
												)
											}
											className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-400/10"
											title="Hapus peserta"
										>
											<Trash
												className="w-5 h-5"
												weight="bold"
											/>
										</button>
									)}
							</div>
						))}
					</div>
					{participants.length === 0 && (
						<div className="text-center py-12 sm:py-20">
							<div className="max-w-md mx-auto">
								<div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center">
									<Books
										className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400"
										weight="bold"
									/>
								</div>
								<h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
									Belum Ada Peserta
								</h3>
								<p className="text-sm sm:text-base text-gray-400">
									Undang peserta untuk bergabung ke kelas ini
								</p>
							</div>
						</div>
					)}
				</div>
			</main>
			<Footer />
		</div>
	);
}
