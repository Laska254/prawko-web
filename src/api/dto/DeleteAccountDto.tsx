export interface DeleteAccountDto {
    // `null` for a user without a password.
    readonly password: string | null;
}
