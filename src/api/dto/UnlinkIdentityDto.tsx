export interface UnlinkIdentityDto {
    // Required when the user has a password, `null` without one.
    readonly currentPassword: string | null;
}
