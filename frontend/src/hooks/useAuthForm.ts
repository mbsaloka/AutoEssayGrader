import { useState } from "react";
import { useRouter } from "next/navigation";

interface UseAuthFormProps<T> {
	initialValues: T;
	onSubmit: (
		values: T
	) => Promise<{ success: boolean; error?: string; data?: unknown }>;
	validate: (values: T) => {
		isValid: boolean;
		errors: Record<string, string>;
	};
	redirectPath?: string;
}

export function useAuthForm<T extends Record<string, unknown>>({
	initialValues,
	onSubmit,
	validate,
	redirectPath,
}: UseAuthFormProps<T>) {
	const router = useRouter();
	const [formData, setFormData] = useState<T>(initialValues);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(false);
	const [apiError, setApiError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));

		if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
		if (apiError) setApiError("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setApiError("");
		setSuccessMessage("");

		const validation = validate(formData);
		if (!validation.isValid) {
			setErrors(validation.errors);
			return;
		}

		setIsLoading(true);
		try {
			const response = await onSubmit(formData);

			if (response.success) {
				const data = response.data as { message?: string } | undefined;
				if (data?.message) {
					setSuccessMessage(data.message);
				}
				if (redirectPath) {
					setTimeout(() => router.push(redirectPath), 2000);
				}
			} else {
				setApiError(
					response.error || "Terjadi kesalahan. Silakan coba lagi."
				);
			}
		} catch (error) {
			console.error("Form submission error:", error);
			setApiError(
				"Terjadi kesalahan yang tidak terduga. Silakan coba lagi."
			);
		} finally {
			setIsLoading(false);
		}
	};

	return {
		formData,
		errors,
		isLoading,
		apiError,
		successMessage,
		handleChange,
		handleSubmit,
	};
}
