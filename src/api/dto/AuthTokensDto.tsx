export interface AuthTokensDto {
    readonly accessToken: string;
    readonly refreshToken: string;
    // Seconds until the access token expires.
    readonly expiresIn: number;
}
