export interface LoginDto {
    userName: string;
    password: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmedNewPassword: string;
}