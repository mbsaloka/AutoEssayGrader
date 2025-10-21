"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services";
import AuthLayout from "@/components/AuthLayout";
import GuestRoute from "@/components/GuestRoute";
import Button from "@/components/Button";
import PasswordInput from "@/components/PasswordInput";
import Alert from "@/components/Alert";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
	return (
		<GuestRoute>
			<LoginContent />
		</GuestRoute>
	);
}

function LoginContent() {
	const searchParams = useSearchParams();
	const { login } = useAuth();

	const [formData, setFormData] = useState({
		email: "",
		password: "",
		rememberMe: false,
	});
	const [errors, setErrors] = useState<{ email?: string; password?: string }>(
		{}
	);
	const [isLoading, setIsLoading] = useState(false);
	const [apiError, setApiError] = useState("");

	// Handle OAuth callback
	useEffect(() => {
		const token = searchParams.get("token");
		if (token) {
			// Token dari OAuth callback
			toast.success("Login berhasil!");
			localStorage.setItem("token", token);
			setTimeout(() => {
				window.location.href = "/dashboard";
			}, 1000);
		}
	}, [searchParams]);

	// GuestRoute already handles redirect, no need for duplicate check

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
		// Clear error when user types
		if (errors[name as keyof typeof errors]) {
			setErrors((prev) => ({ ...prev, [name]: undefined }));
		}
	};

	const validateForm = () => {
		const newErrors: { email?: string; password?: string } = {};

		if (!formData.email) {
			newErrors.email = "Email wajib diisi";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Format email tidak valid";
		}

		if (!formData.password) {
			newErrors.password = "Password wajib diisi";
		} else if (formData.password.length < 8) {
			newErrors.password = "Password minimal 8 karakter";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setApiError("");

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);

		try {
			const response = await authService.login({
				email: formData.email,
				password: formData.password,
			});

			// Save auth data
			login(response.user, response.access_token, formData.rememberMe);

			// Show success toast
			toast.success("Login berhasil!", {
				duration: 1000,
				style: {
					background: "#10B981",
					color: "#fff",
				},
			});

			// Redirect to dashboard with refresh
			setTimeout(() => {
				window.location.href = "/dashboard";
			}, 1500);
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Login gagal";
			setApiError(errorMessage);
			toast.error(errorMessage, {
				duration: 3000,
				style: {
					background: "#EF4444",
					color: "#fff",
				},
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		try {
			const response = await authService.getGoogleAuthUrl();
			window.location.href = response.authorization_url;
		} catch {
			toast.error("Gagal memulai login Google", {
				style: {
					background: "#EF4444",
					color: "#fff",
				},
			});
		}
	};

	const handleGithubLogin = async () => {
		try {
			const response = await authService.getGithubAuthUrl();
			window.location.href = response.authorization_url;
		} catch {
			toast.error("Gagal memulai login GitHub", {
				style: {
					background: "#EF4444",
					color: "#fff",
				},
			});
		}
	};

	return (
		<AuthLayout>
			<Toaster position="top-center" />
			<form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
				<Alert type="error" message={apiError} />
				<div>
					<label
						htmlFor="email"
						className="block text-xs sm:text-sm font-medium text-white mb-2"
					>
						Email
					</label>
					<input
						id="email"
						name="email"
						type="email"
						placeholder="Tulis alamat email Anda"
						value={formData.email}
						onChange={handleChange}
						className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-white dark:bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-full text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-yellow-400 dark:focus:border-gray-400 transition-colors"
						required
					/>
					{errors.email && (
						<p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">
							{errors.email}
						</p>
					)}
				</div>

				<PasswordInput
					id="password"
					name="password"
					label="Kata Sandi"
					value={formData.password}
					placeholder="Masukkkan Kata Sandi Anda"
					onChange={handleChange}
					error={errors.password}
				/>

				<Button
					type="submit"
					variant="primary"
					size="lg"
					fullWidth
					isLoading={isLoading}
				>
					Login
				</Button>

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
					</div>
					<div className="relative flex justify-center text-xs sm:text-sm">
						<span className="px-4 bg-gray-800 dark:bg-white text-gray-500">
							Atau login dengan
						</span>
					</div>
				</div>

				{/* <div className="grid grid-cols-2 gap-3 sm:gap-4">
					<button
						type="button"
						onClick={handleGoogleLogin}
						className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-xs sm:text-sm border border-gray-200"
					>
						<FcGoogle className="w-4 h-4 sm:w-5 sm:h-5" />
						<span className="hidden sm:inline">Google</span>
					</button>
					<button
						type="button"
						onClick={handleGithubLogin}
						className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-xs sm:text-sm border border-gray-700"
					>
						<FaGithub className="w-4 h-4 sm:w-5 sm:h-5" />
						<span className="hidden sm:inline">GitHub</span>
					</button>
				</div> */}

				<div className="text-center">
					<span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
						Belum punya akun?{" "}
					</span>
					<Link
						href="/daftar"
						className="text-xs sm:text-sm text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
					>
						Daftar di sini
					</Link>
				</div>
			</form>
		</AuthLayout>
	);
}
