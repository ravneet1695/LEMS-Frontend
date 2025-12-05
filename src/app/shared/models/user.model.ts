export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    role: 'super_admin' | 'org_admin' | 'content_creator' | 'content_approver' | 'manager' | 'learner';
    organization?: any;
    groups?: any[];
    profileImage?: string;
    isActive: boolean;
    lastLogin?: Date;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    organization?: string;
}

export interface AuthResponse {
    success: boolean;
    data: {
        user: User;
        token: string;
        refreshToken: string;
    };
}
