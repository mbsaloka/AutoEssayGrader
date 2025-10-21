"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { authService, classService } from "@/services";
import toast from "react-hot-toast";
import {
	MagnifyingGlass,
	Plus,
	DotsThreeVertical,
	Users,
	Calendar,
	Books,
	X,
} from "phosphor-react";

export default function HomePage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { login, isAuthenticated } = useAuth();
	const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
	useEffect(() => {
		const token = searchParams.get("token");

		if (token && !isAuthenticated && !isProcessingOAuth) {
			setIsProcessingOAuth(true);

			const handleOAuthLogin = async () => {
				try {
					localStorage.setItem("token", token);
					const userData = await authService.getCurrentUser();

					if (userData) {
						login(userData, token, true);
						toast.success(`Selamat datang, ${userData.fullname}!`, {
							duration: 2000,
						});

						setTimeout(() => {
							window.location.href = "/dashboard";
						}, 1500);
					}
				} catch (error) {
					console.error("OAuth error:", error);
					toast.error("Gagal login dengan OAuth");
					setIsProcessingOAuth(false);
					router.push("/masuk");
				}
			};

			handleOAuthLogin();
		}
	}, [searchParams, login, router, isAuthenticated, isProcessingOAuth]);

	if (isProcessingOAuth) {
		return <LoadingSpinner fullScreen text="Memproses login..." />;
	}

	return (
		<ProtectedRoute>
			<HomeContent />
		</ProtectedRoute>
	);
}

function HomeContent() {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab] = useState<"all" | "assessment">("all");
	const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
	const [classCode, setClassCode] = useState("");
	const [isJoining, setIsJoining] = useState(false);
	const { isAuthenticated, user } = useAuth();
	const queryClient = useQueryClient();

	const {
		data: classes,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["classes"],
		queryFn: async () => {
			const result = await classService.getAllClasses();
			return result;
		},
		enabled: isAuthenticated,
		retry: 1,
	});

	const handleJoinClass = async () => {
		if (!classCode.trim()) {
			toast.error("Kode kelas tidak boleh kosong");
			return;
		}

		setIsJoining(true);
		try {
			const response = await classService.joinClass({
				class_code: classCode.trim(),
			});
			toast.success(
				response.message || "Berhasil bergabung dengan kelas!"
			);
			setIsJoinModalOpen(false);
			setClassCode("");
			queryClient.invalidateQueries({ queryKey: ["classes"] });
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			console.error("Error joining class:", error);
			toast.error(
				error.response?.data?.detail || "Gagal bergabung dengan kelas"
			);
		} finally {
			setIsJoining(false);
		}
	};

	useEffect(() => {
		if (error) {
			console.error("Error fetching classes:", error);
			toast.error("Gagal memuat kelas");
		}
	}, [error]);

	const filteredClasses =
		classes?.filter(
			(cls) =>
				cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				cls.teacher_name
					.toLowerCase()
					.includes(searchQuery.toLowerCase())
		) || [];

	const getClassColor = (index: number) => {
		const colors = [
			"bg-gradient-to-br from-yellow-600 to-yellow-700",
			"bg-gradient-to-br from-blue-700 to-blue-800",
			"bg-gradient-to-br from-yellow-600 to-yellow-700",
			"bg-gradient-to-br from-yellow-600 to-yellow-700",
			"bg-gradient-to-br from-blue-700 to-blue-800",
			"bg-gradient-to-br from-yellow-600 to-yellow-700",
		];
		return colors[index % colors.length];
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex flex-col bg-[#2b2d31]">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<LoadingSpinner size="lg" text="Memuat kelas..." />
				</div>
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col bg-[#2b2d31]">
			<Navbar />
			<main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				{/* <div className="mb-4 sm:mb-6 flex items-center gap-1 border-b border-gray-700 overflow-x-auto">
          <Link
            href="/dashboard"
            className={`px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors relative whitespace-nowrap text-sm sm:text-base ${
              activeTab === "all"
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Semua
            {activeTab === "all" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </Link>
          <Link
            href="/hasil-penilaian"
            className={`px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors relative whitespace-nowrap text-sm sm:text-base ${
              activeTab === "assessment"
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Penilaian Saya
            {activeTab === "assessment" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </Link>
        </div> */}

				<div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<h1 className="text-2xl sm:text-3xl font-bold text-white">
							Kelas Saya
						</h1>
					</div>
					{/* Search */}
					<div className="relative w-full sm:w-64">
						<input
							type="text"
							placeholder="Search"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full px-4 py-2 pl-10 bg-[#1e1f22] rounded-3xl border-2 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-gray-100 transition-colors"
						/>
						<MagnifyingGlass
							className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
							weight="bold"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
					{user?.user_role === "dosen" && (
						<Link href="/kelas/baru">
							<div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] border-2 border-dashed border-gray-900 hover:border-gray-500 flex items-center justify-center group">
								<div className="text-center">
									<div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-full bg-gray-700 group-hover:bg-gray-600 flex items-center justify-center transition-colors">
										<Plus
											className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400 group-hover:text-gray-300"
											weight="bold"
										/>
									</div>
									<p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 font-medium">
										Buat Kelas Baru
									</p>
								</div>
							</div>
						</Link>
					)}

					{user?.user_role === "mahasiswa" && (
						<div
							onClick={() => setIsJoinModalOpen(true)}
							className="relative h-48 sm:h-56 rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] border-2 border-dashed border-gray-900 hover:border-gray-500 flex items-center justify-center group"
						>
							<div className="text-center">
								<div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-full bg-gray-700 group-hover:bg-gray-600 flex items-center justify-center transition-colors">
									<Plus
										className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400 group-hover:text-gray-300"
										weight="bold"
									/>
								</div>
								<p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 font-medium">
									Gabung Kelas
								</p>
							</div>
						</div>
					)}

					{filteredClasses.map((cls, index) => (
						<Link key={cls.id} href={`/kelas/${cls.id}`}>
							<div
								className={`relative h-48 sm:h-56 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] shadow-lg cursor-pointer ${getClassColor(
									index
								)}`}
							>
								<div className="relative z-10 p-4 sm:p-6 h-full flex flex-col">
									<div className="flex items-start justify-between mb-auto">
										<div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-white/20 flex items-center justify-center">
											<Books
												className="w-5 h-5 sm:w-6 sm:h-6 text-dark dark:text-gray-200"
												weight="bold"
											/>
										</div>
										<button
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												toast("Menu opsi kelas");
											}}
											className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
										>
											<DotsThreeVertical
												className="w-5 h-5"
												weight="bold"
											/>
										</button>
									</div>
									<div className="mt-4">
										<h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
											{cls.name}
										</h3>
										<p className="text-sm text-white/80 mb-2">
											{cls.teacher_name}
										</p>
										<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-white/90 text-xs sm:text-sm">
											<div className="flex items-center gap-1.5">
												<Calendar
													className="w-4 h-4"
													weight="bold"
												/>
												<span>
													{new Date(
														cls.created_at
													).toLocaleDateString(
														"id-ID",
														{
															day: "numeric",
															month: "short",
														}
													)}
												</span>
											</div>
											<div className="flex items-center gap-1.5">
												<Users
													className="w-4 h-4"
													weight="bold"
												/>
												<span>
													{cls.participant_count}{" "}
													peserta
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</Link>
					))}
				</div>
				{filteredClasses.length === 0 && (
					<div className="text-center py-12 sm:py-20">
						<div className="max-w-md mx-auto">
							<div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gray-700 flex items-center justify-center">
								<Books
									className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400"
									weight="bold"
								/>
							</div>
							<h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
								Belum Ada Kelas
							</h3>
							<p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">
								{searchQuery
									? "Tidak ada kelas yang cocok dengan pencarian"
									: user?.user_role === "dosen"
									? "Buat kelas baru atau bergabung dengan kelas yang ada"
									: "Bergabung dengan kelas yang ada"}
							</p>
						</div>
					</div>
				)}
			</main>

			<Footer />

			{/* Join Class Modal */}
			{isJoinModalOpen && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-[#1e1f22] rounded-2xl max-w-md w-full p-6 sm:p-8 relative">
						<button
							onClick={() => {
								setIsJoinModalOpen(false);
								setClassCode("");
							}}
							className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
						>
							<X className="w-6 h-6" weight="bold" />
						</button>

						<h2 className="text-2xl font-bold text-white mb-2">
							Gabung Kelas
						</h2>
						<p className="text-gray-400 mb-6">
							Masukkan kode kelas untuk bergabung
						</p>

						<div className="mb-6">
							<label
								htmlFor="classCode"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Kode Kelas
							</label>
							<input
								id="classCode"
								type="text"
								value={classCode}
								onChange={(e) => setClassCode(e.target.value)}
								onKeyPress={(e) => {
									if (e.key === "Enter" && !isJoining) {
										handleJoinClass();
									}
								}}
								placeholder="Masukkan kode kelas"
								className="w-full px-4 py-3 bg-[#2b2d31] rounded-lg border-2 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
								disabled={isJoining}
							/>
						</div>

						<div className="flex gap-3">
							<button
								onClick={() => {
									setIsJoinModalOpen(false);
									setClassCode("");
								}}
								className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
								disabled={isJoining}
							>
								Batal
							</button>
							<button
								onClick={handleJoinClass}
								disabled={isJoining || !classCode.trim()}
								className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isJoining ? "Bergabung..." : "Gabung"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
