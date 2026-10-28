import {Button, Typography} from "@mui/material";
import {ErrorOutline} from "@mui/icons-material";
import {PageState} from "./PageState.tsx";

interface PageErrorProps {
    message: string;
    onRetry: () => void;
}

// `role="alert"` makes screen readers announce the error when it replaces the page content.
export function PageError({message, onRetry}: PageErrorProps) {
    return (
        <PageState role="alert">
            <ErrorOutline color="error" fontSize="large"/>
            <Typography>{message}</Typography>
            <Button variant="outlined" onClick={onRetry}>Try again</Button>
        </PageState>
    );
}
