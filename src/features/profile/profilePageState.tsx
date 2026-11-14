import type {ParseKeys} from "i18next";
import type {GitHubSignInDto} from "@/api/dto/GitHubSignInDto.tsx";

// What other pages hand to the profile through the navigation state. `LinkGitHubCallbackPage` hands GitHub's code with
// what's needed to exchange it, or why linking failed, and nothing when the user didn't agree to it. `/account/delete`
// asks for the account's deletion dialog.
export interface ProfilePageState {
    readonly gitHubLink?: GitHubSignInDto;
    readonly failure?: ParseKeys<"profile">;
    readonly deleteAccount?: boolean;
}
