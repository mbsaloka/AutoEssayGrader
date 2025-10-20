import { PasswordStrengthResult, FormValidationResult } from '@/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,}$/;

export const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email);
export const isValidUsername = (username: string): boolean => USERNAME_REGEX.test(username);
export const checkPasswordStrength = (password: string): PasswordStrengthResult => {
    const checks = {
        hasMinLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const criteriaCount = [
        checks.hasMinLength,
        checks.hasUpperCase,
        checks.hasLowerCase,
        checks.hasNumber,
    ].filter(Boolean).length;            

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    let message = 'Kata sandi terlalu lemah';

    if (criteriaCount === 4 && checks.hasSpecialChar) {
        strength = 'strong';
        message = 'Kata sandi kuat';
    } else if (criteriaCount === 4) {
        strength = 'medium';
        message = 'Kata sandi sedang (tambahkan karakter khusus untuk kata sandi kuat)';
    } else if (criteriaCount >= 3) {
        strength = 'medium';
        message = 'Kata sandi sedang';
    }

    return { strength, message, ...checks };
};
export const validateLoginForm = (emailOrUsername: string, password: string): FormValidationResult => {
    const errors: Record<string, string> = {};

    if (!emailOrUsername.trim()) errors.emailOrUsername = 'Email atau nama pengguna wajib diisi';
    if (!password) errors.password = 'Kata sandi wajib diisi';

    return { isValid: Object.keys(errors).length === 0, errors };
};
export const validateRegisterForm = (
    fullName: string,
    email: string,
    username: string,
    password: string,
    confirmPassword: string,
    acceptTerms: boolean
): FormValidationResult => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
        errors.fullName = 'Nama lengkap wajib diisi';
    } else if (fullName.trim().length < 2) {
        errors.fullName = 'Nama lengkap minimal 2 karakter';
    }

    if (!email.trim()) {
        errors.email = 'Email wajib diisi';
    } else if (!isValidEmail(email)) {
        errors.email = 'Mohon masukkan alamat email yang valid';
    }

    if (!username.trim()) {
        errors.username = 'Nama pengguna wajib diisi';
    } else if (!isValidUsername(username)) {
        errors.username = 'Nama pengguna minimal 4 karakter dan hanya boleh berisi huruf, angka, dan garis bawah';
    }

    if (!password) {
        errors.password = 'Kata sandi wajib diisi';
    } else {
        const { hasMinLength, hasUpperCase, hasNumber } = checkPasswordStrength(password);
        if (!hasMinLength) errors.password = 'Kata sandi minimal 8 karakter';
        else if (!hasUpperCase) errors.password = 'Kata sandi harus mengandung minimal satu huruf besar';
        else if (!hasNumber) errors.password = 'Kata sandi harus mengandung minimal satu angka';
    }

    if (!confirmPassword) {
        errors.confirmPassword = 'Mohon konfirmasi kata sandi Anda';
    } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Kata sandi tidak cocok';
    }

    if (!acceptTerms) errors.acceptTerms = 'Anda harus menyetujui syarat dan ketentuan';

    return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateGradingForm = (
    title: string,
    topic: string,
    content: string,
    criteria: string[]
): FormValidationResult => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
        errors.title = 'Judul esai wajib diisi';
    } else if (title.trim().length < 5) {
        errors.title = 'Judul minimal 5 karakter';
    }

    if (!topic.trim()) errors.topic = 'Topik wajib diisi';

    if (!content.trim()) {
        errors.content = 'Konten esai wajib diisi';
    } else if (content.trim().length < 100) {
        errors.content = 'Esai minimal 100 karakter';
    }

    if (criteria.length === 0) errors.criteria = 'Mohon pilih minimal satu kriteria penilaian';

    return { isValid: Object.keys(errors).length === 0, errors };
};
