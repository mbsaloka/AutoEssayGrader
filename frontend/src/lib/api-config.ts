// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    LOGIN: `${API_URL}/api/login`,
    REGISTER: `${API_URL}/api/register`,
    OAUTH_GOOGLE: `${API_URL}/api/auth/google`,
    OAUTH_GITHUB: `${API_URL}/api/auth/github`,

    // Users
    USERS: `${API_URL}/api/users`,
    USER_PROFILE: (userId: string) => `${API_URL}/api/users/${userId}`,
    USER_BY_EMAIL: (email: string) => `${API_URL}/api/users/email/${email}`,

    // Classes
    CLASSES: `${API_URL}/api/classes`,
    CLASS_DETAIL: (classId: string) => `${API_URL}/api/classes/${classId}`,
    CLASS_JOIN: (classId: string) => `${API_URL}/api/classes/${classId}/join`,
    CLASS_STUDENTS: (classId: string) => `${API_URL}/api/classes/${classId}/students`,
    CLASS_STUDENT_REMOVE: (classId: string, userId: string) =>
        `${API_URL}/api/classes/${classId}/students/${userId}`,

    // Assignments
    CLASS_ASSIGNMENTS: (classId: string) => `${API_URL}/api/classes/${classId}/assignments`,
    ASSIGNMENT_DETAIL: (assignmentId: string) => `${API_URL}/api/assignments/${assignmentId}`,

    // Grading (OCR & AI)
    OCR_EXTRACT: `${API_URL}/api/ocr/extract`,
    GRADING_EVALUATE: `${API_URL}/api/grading/evaluate`,
};

// OAuth Callback URLs
export const OAUTH_CALLBACKS = {
    GOOGLE: `${FRONTEND_URL}/auth/callback/google`,
    GITHUB: `${FRONTEND_URL}/auth/callback/github`,
};
