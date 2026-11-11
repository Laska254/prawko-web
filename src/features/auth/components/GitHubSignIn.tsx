import {GitHub} from "@mui/icons-material";
import {Button} from "@mui/material";
import {useTranslation} from "react-i18next";
import {GOOGLE_BUTTON_HEIGHT} from "@/components/google/googleIdentity.tsx";
import {startGitHubSignIn} from "../gitHubAuthorization.tsx";

interface GitHubSignInProps {
    clientId: string;
}

// Leaves for GitHub; `GitHubCallbackPage` finishes the sign in, or sends the user back to `/auth` with the failure.
export function GitHubSignIn({clientId}: GitHubSignInProps) {
    const {t} = useTranslation("auth");

    // Styled to sit next to Google's button: its height, a thin border and a lighter label than the app's buttons.
    return (
        <Button variant="outlined" color="inherit" fullWidth startIcon={<GitHub/>}
                onClick={() => startGitHubSignIn(clientId)}
                sx={{height: GOOGLE_BUTTON_HEIGHT, borderColor: "divider", fontWeight: 500}}>
            {t("providers.continueWithGitHub")}
        </Button>
    );
}
