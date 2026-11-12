import type {ParseKeys} from "i18next";
import type {GitHubSignInDto} from "@/api/dto/GitHubSignInDto.tsx";

// Where GitHub sends the user back to after they agreed to link it. It's one of the callback URLs of the GitHub app's
// settings.
export const GITHUB_LINK_CALLBACK_PATH = "/auth/github/callback/link";

// What `LinkGitHubCallbackPage` hands to the profile: GitHub's code with what's needed to exchange it, or why linking
// failed. Nothing when the user didn't agree to it.
export interface ProfilePageState {
    readonly gitHubLink?: GitHubSignInDto;
    readonly failure?: ParseKeys<"profile">;
}
