export interface ChangePasswordDto {
    readonly currentPassword: string;
    readonly newPassword: string;
    readonly confirmedNewPassword: string;
}