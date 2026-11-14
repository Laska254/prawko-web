import {GitHub} from "@mui/icons-material";
import {Button} from "@mui/material";
import {useTranslation} from "react-i18next";
import {GOOGLE_BUTTON_HEIGHT} from "../google/googleIdentity.tsx";
import {startGitHubAuthorization} from "./gitHubAuthorization.tsx";

interface GitHubButtonProps {
    readonly clientId: string;
    // The app's page GitHub sends the user back to, which finishes what the button started.
    readonly redirectPath: string;
    // The app's page that page goes on to once done, kept while the user is on GitHub's.
    readonly returnPath?: string;
    // Runs as the button leaves, e.g. to change the page's history entry first.
    readonly onStart?: () => void;
}

// Leaves for GitHub's consent page.
export function GitHubButton({clientId, redirectPath, returnPath, onStart}: GitHubButtonProps) {
    const {t} = useTranslation();

    // Styled to sit next to Google's button: its height, a thin border and a lighter label than the app's buttons.
    return (
        <Button variant="outlined" color="inherit" fullWidth startIcon={<GitHub/>}
                onClick={() => {
                    onStart?.();
                    return startGitHubAuthorization(clientId, redirectPath, returnPath);
                }}
                sx={{height: GOOGLE_BUTTON_HEIGHT, borderColor: "divider", fontWeight: 500}}>
            {t("gitHub.continue")}
        </Button>
    );
}
