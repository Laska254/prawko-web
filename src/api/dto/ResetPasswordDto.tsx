export interface ResetPasswordDto {
    readonly token: string;
    readonly newPassword: string;
}
