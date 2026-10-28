// Only the given fields are changed.
export interface UserUpdateDto {
    readonly firstName?: string;
    readonly lastName?: string;
    readonly userName?: string;
    readonly email?: string;
}
