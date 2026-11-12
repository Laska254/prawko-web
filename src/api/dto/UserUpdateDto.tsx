// Only the given fields are changed.
export interface UserUpdateDto {
    readonly firstName?: string;
    readonly lastName?: string;
    readonly userName?: string;
    readonly email?: string;
    // Required to change one's own username or email when the user has a password, `null` without one.
    readonly currentPassword?: string | null;
}
