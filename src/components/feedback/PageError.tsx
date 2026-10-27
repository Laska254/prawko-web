import {Button, Stack, Typography} from "@mui/material";
import {ErrorOutline} from "@mui/icons-material";

interface PageErrorProps {
    message: string;
    onRetry: () => void;
}

// `role="alert"` makes screen readers announce the error when it replaces the page content.
export function PageError({message, onRetry}: PageErrorProps) {
    return (
        <Stack role="alert" alignItems="center" justifyContent="center" spacing={2} py={8} textAlign="center">
            <ErrorOutline color="error" fontSize="large"/>
            <Typography>{message}</Typography>
            <Button variant="outlined" onClick={onRetry}>Try again</Button>
        </Stack>
    );
}
