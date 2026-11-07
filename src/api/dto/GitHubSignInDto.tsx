export interface GitHubSignInDto {
    readonly code: string;
    readonly codeVerifier: string;
    readonly redirectUri: string;
}
