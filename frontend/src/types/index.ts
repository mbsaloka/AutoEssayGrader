export interface User {
    id: number;
    email: string;
    fullname: string;
    username: string;
    notelp?: string;
    institution?: string;
    biografi?: string;
    profile_picture?: string;
    is_active: boolean;
    is_verified: boolean;
    is_superuser: boolean;
    is_oauth_user?: boolean; // Flag untuk OAuth user
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    loginTimestamp?: string; // ISO timestamp when user logged in
}

export interface LoginFormData {
    emailOrUsername: string;
    password: string;
    rememberMe: boolean;
}

export interface RegisterFormData {
    fullname: string;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    notelp?: string;
    institution?: string;
    biografi?: string;
    acceptTerms: boolean;
}

export interface Essay {
    id: string;
    title: string;
    topic: string;
    content: string;
    fileName?: string;
    createdAt: string;
    status: 'pending' | 'graded' | 'processing';
    score?: number;
    feedback?: string;
}

export interface GradingCriteria {
    id: string;
    name: string;
    description: string;
    weight: number;
}

export interface NewGradingFormData {
    title: string;
    topic: string;
    content: string;
    criteria: string[];
    file?: File;
}

export interface GradingResult {
    id: string;
    essayId: string;
    score: number;
    maxScore: number;
    feedback: string;
    criteriaScores: {
        criteriaId: string;
        criteriaName: string;
        score: number;
        maxScore: number;
        feedback: string;
    }[];
    gradedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface LoginResponse {
    user: User;
    token: string;
}

export interface RegisterResponse {
    user: User;
    message: string;
}

export interface DashboardStats {
    totalEssays: number;
    gradedEssays: number;
    pendingEssays: number;
    averageScore: number;
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface FormValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordStrengthResult {
    strength: PasswordStrength;
    message: string;
    hasMinLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
}
