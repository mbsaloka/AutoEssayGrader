// ==================== USER & AUTH TYPES ====================
export type UserRole = "dosen" | "mahasiswa";

export interface User {
    id: number;
    fullname: string;
    username: string;
    email: string;
    notelp?: string;
    institution?: string;
    biografi?: string;
    profile_picture?: string;
    user_role: UserRole;
    is_active: boolean;
    is_verified: boolean;
    is_superuser: boolean;
    is_oauth_user?: boolean;
}

export interface UserCreate {
    fullname: string;
    username: string;
    email: string;
    password: string;
    user_role?: UserRole;
    notelp?: string;
    institution?: string;
    biografi?: string;
    profile_picture?: string;
}

export interface UserUpdate {
    fullname?: string;
    username?: string;
    email?: string;
    user_role?: UserRole;
    notelp?: string;
    institution?: string;
    biografi?: string;
    profile_picture?: string;
    password?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface RegisterResponse {
    message: string;
    user: User;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    loginTimestamp?: string;
}

// ==================== PROFILE TYPES ====================
export interface UpdateProfileRequest {
    fullname?: string;
    email?: string;
}

export interface ChangePasswordRequest {
    current_password: string;
    new_password: string;
}

export interface ProfileResponse {
    id: number;
    username: string;
    email: string;
    fullname?: string;
    user_role: string;
    profile_picture?: string;
}

// ==================== CLASS TYPES ====================
export interface CreateClassRequest {
    name: string;
    description?: string;
}

export interface UpdateClassRequest {
    name?: string;
    description?: string;
}

export interface JoinClassRequest {
    class_code: string;
}

export interface ClassResponse {
    id: number;
    name: string;
    description?: string;
    class_code: string;
    teacher_id: number;
    teacher_name: string;
    participant_count: number;
    created_at: string;
}

export interface ClassDetailResponse extends ClassResponse {
    participants: ParticipantInfo[];
    assignments_count: number;
}

export interface ParticipantInfo {
    id: number;
    user_id: number;
    username: string;
    fullname: string;
    email: string;
    joined_at: string;
}

export interface InviteCodeResponse {
    class_code: string;
    invite_link: string;
    class_name: string;
}

// ==================== ASSIGNMENT TYPES ====================
export type AssignmentType = "file_based" | "text_based";
export type SubmissionType = "typed" | "ocr";

export interface CreateAssignmentRequest {
    kelas_id: number;
    title: string;
    description?: string;
    assignment_type?: AssignmentType;
    deadline?: string;
    max_score?: number;
    minimal_score?: number;
    questions?: string; // Questions as a string (can contain multiple questions)
}

export interface UpdateAssignmentRequest {
    title?: string;
    description?: string;
    assignment_type?: AssignmentType;
    deadline?: string;
    max_score?: number;
    minimal_score?: number;
    is_published?: boolean;
    questions?: string; // Questions as a string
}

export interface QuestionCreate {
    question_text: string;
    reference_answer: string;
    question_order: number;
    points: number;
}

export interface Question {
    id: number;
    assignment_id: number;
    question_text: string;
    reference_answer: string;
    question_order: number;
    points: number;
}

export interface AssignmentResponse {
    id: number;
    kelas_id: number;
    title: string;
    description?: string;
    assignment_type: AssignmentType;
    deadline?: string;
    max_score: number;
    minimal_score: number;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    questions?: Question[];
}

export interface AssignmentDetailResponse extends AssignmentResponse {
    submission_count: number;
    class_name: string;
}

export interface SubmitAnswerRequest {
    answers: AnswerSubmit[];
}

export interface AnswerSubmit {
    question_id: number;
    answer_text: string;
}

export interface SubmissionResponse {
    id: number;
    assignment_id: number;
    student_id: number;
    student_name: string;
    submission_type: SubmissionType;
    file_path?: string;
    submitted_at: string;
    score?: number;
}

export interface MySubmissionResponse {
    submitted: boolean;
    submission_id?: number;
    submission_type?: SubmissionType;
    submitted_at?: string;
    answers?: Array<{
        question_id: number;
        question_text: string;
        answer_text: string;
        final_score?: number;
        feedback?: string;
    }>;
    total_score?: number;
    max_score?: number;
    percentage?: number;
    graded?: boolean;
    submission?: SubmissionResponse;
}

// ==================== GRADING TYPES ====================
export interface GradeSubmissionRequest {
    total_score: number;
}

export interface QuestionAnswer {
    id: number;
    submission_id: number;
    question_id: number;
    answer_text: string;
    final_score?: number;
    feedback?: string;
    rubric_pemahaman?: number;
    rubric_kelengkapan?: number;
    rubric_kejelasan?: number;
    rubric_analisis?: number;
    rubric_rata_rata?: number;
    embedding_similarity?: number;
    llm_time?: number;
    similarity_time?: number;
}

export interface NilaiResponse {
    id: number;
    submission_id: number;
    student_id: number;
    student_name: string;
    assignment_id: number;
    assignment_title: string;
    total_score: number;
    max_score: number;
    percentage?: number;
    avg_pemahaman?: number;
    avg_kelengkapan?: number;
    avg_kejelasan?: number;
    avg_analisis?: number;
    avg_embedding_similarity?: number;
    total_llm_time?: number;
    total_similarity_time?: number;
    graded_at: string;
    question_answers?: QuestionAnswer[];
}

export interface AutoGradeResponse {
    message: string;
    nilai_id: number;
    grading_results: NilaiResponse;
}

export interface AutoGradeAllResponse {
    message: string;
    total_submissions: number;
    newly_graded: number;
}

export interface AssignmentStatisticsResponse {
    assignment_id: number;
    assignment_title: string;
    total_students: number;
    total_submissions: number;
    graded_submissions: number;
    passed_students: number;
    failed_students: number;
    pass_percentage: number;
    fail_percentage: number;
    average_score?: number;
    highest_score?: number;
    lowest_score?: number;
    minimal_score: number;
}

export interface QuestionGradeDetail {
    question_id: number;
    question_text: string;
    question_points: number;
    answer_text: string;
    final_score?: number;
    feedback?: string;
    rubric_pemahaman?: number;
    rubric_kelengkapan?: number;
    rubric_kejelasan?: number;
    rubric_analisis?: number;
    rubric_rata_rata?: number;
    embedding_similarity?: number;
}

export interface SubmissionDetailResponse {
    submission_id: number;
    student_id: number;
    student_name: string;
    assignment_id: number;
    assignment_title: string;
    submission_type: SubmissionType;
    submitted_at: string;
    graded: boolean;
    total_score?: number;
    max_score?: number;
    percentage?: number;
    avg_pemahaman?: number;
    avg_kelengkapan?: number;
    avg_kejelasan?: number;
    avg_analisis?: number;
    avg_embedding_similarity?: number;
    graded_at?: string;
    question_details: QuestionGradeDetail[];
}

// ==================== OCR TYPES ====================
export interface OCRResultRead {
    success: boolean;
    message: string;
    result_text?: string;
    filename?: string;
    processed_at?: string;
}

// ==================== DASHBOARD TYPES ====================
export interface DashboardStats {
    total_classes?: number;
    total_assignments?: number;
    total_submissions?: number;
    average_score?: number;
}

export interface RecentActivity {
    id: number;
    type: string;
    description: string;
    timestamp: string;
}

// ==================== LEGACY UI TYPES (for existing components) ====================
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

// ==================== API RESPONSE TYPES ====================
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface ApiError {
    detail: string;
}
