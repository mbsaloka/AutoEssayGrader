"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { useGetInviteCode } from "@/hooks/useClasses";
import toast from "react-hot-toast";
import { ArrowLeft, Books, Copy, Check } from "phosphor-react";

export default function InvitePesertaPage() {
	return (
		<ProtectedRoute>
			<InvitePesertaContent />
		</ProtectedRoute>
	);
}

function InvitePesertaContent() {
	const router = useRouter();
	const params = useParams();
	const classId = parseInt(params.id as string);
	const { user } = useAuth();

	const [copiedLink, setCopiedLink] = useState(false);
	const [copiedCode, setCopiedCode] = useState(false);
	const [inviteData, setInviteData] = useState<{
		class_code: string;
		invite_link: string;
		class_name: string;
	} | null>(null);
	const linkInputRef = useRef<HTMLInputElement>(null);

	const getInviteCode = useGetInviteCode();

	useEffect(() => {
		if (user && user.user_role !== "dosen") {
			toast.error("Hanya dosen yang dapat mengakses halaman ini");
			router.push(`/kelas/${classId}`);
		}
	}, [user, router, classId]);

	useEffect(() => {
		if (classId && user?.user_role === "dosen") {
			getInviteCode
				.mutateAsync(classId)
				.then((data) => {
					setInviteData(data);
				})
				.catch((error) => {
					console.error("Error fetching invite code:", error);
					toast.error("Gagal memuat kode undangan");
				});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [classId, user]);

	const handleBack = () => {
		router.push(`/kelas/${classId}`);
	};

	const handleCopyLink = async () => {
		if (!inviteData) return;
		try {
			await navigator.clipboard.writeText(inviteData.invite_link);
			setCopiedLink(true);
			toast.success("Tautan berhasil disalin!");
			setTimeout(() => setCopiedLink(false), 2000);
		} catch {
			toast.error("Gagal menyalin tautan");
		}
	};

	const handleCopyCode = async () => {
		if (!inviteData) return;
		try {
			await navigator.clipboard.writeText(inviteData.class_code);
			setCopiedCode(true);
			toast.success("Kode kelas berhasil disalin!");
			setTimeout(() => setCopiedCode(false), 2000);
		} catch {
			toast.error("Gagal menyalin kode kelas");
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
							Hanya dosen yang dapat mengakses halaman ini
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

	if (getInviteCode.isPending || !inviteData) {
		return (
			<div className="min-h-screen flex flex-col bg-[#2b2d31]">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<LoadingSpinner size="lg" text="Memuat kode undangan..." />
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
							<h1 className="text-2xl sm:text-3xl font-bold text-white">
								{inviteData.class_name}
							</h1>
						</div>
					</div>
				</div>

				{/* Invite Section */}
				<div className="max-w-3xl">
					{/* Tautan Section */}
					<div className="mb-6 sm:mb-8">
						<label className="block text-white text-base sm:text-lg font-semibold mb-3">
							Tautan
						</label>
						<div className="relative">
							<input
								ref={linkInputRef}
								type="text"
								value={inviteData.invite_link}
								readOnly
								className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 bg-[#1e1f22] border border-gray-700 rounded-xl text-sm sm:text-base text-white focus:outline-none focus:border-gray-500 transition-colors"
							/>
							<button
								onClick={handleCopyLink}
								className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
								title="Salin tautan"
							>
								{copiedLink ? (
									<Check
										className="w-4 h-4 sm:w-5 sm:h-5 text-green-500"
										weight="bold"
									/>
								) : (
									<Copy
										className="w-4 h-4 sm:w-5 sm:h-5"
										weight="bold"
									/>
								)}
							</button>
						</div>
					</div>

					{/* Kode Kelas Section */}
					<div className="mb-6 sm:mb-8">
						<label className="block text-white text-base sm:text-lg font-semibold mb-3">
							Kode Kelas
						</label>
						<div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-4 sm:p-6">
							<div className="flex items-center justify-between">
								<span className="text-yellow-400 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wider">
									{inviteData.class_code}
								</span>
								<button
									onClick={handleCopyCode}
									className="text-gray-400 hover:text-white transition-colors ml-4"
									title="Salin kode"
								>
									{copiedCode ? (
										<Check
											className="w-5 h-5 sm:w-6 sm:h-6 text-green-500"
											weight="bold"
										/>
									) : (
										<Copy
											className="w-5 h-5 sm:w-6 sm:h-6"
											weight="bold"
										/>
									)}
								</button>
							</div>
						</div>
					</div>

					{/* Info Text */}
					<p className="text-gray-400 text-center text-xs sm:text-sm">
						Bagikan tautan dan kode kelas ini ke peserta didik di
						kelas ini
					</p>
				</div>
			</main>

			<Footer />
		</div>
	);
}
