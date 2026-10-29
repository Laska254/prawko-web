import {Button, Typography} from "@mui/material";
import {ErrorOutline} from "@mui/icons-material";
import {useTranslation} from "react-i18next";
import {PageState} from "./PageState.tsx";

interface PageErrorProps {
    message: string;
    onRetry: () => void;
}

// `role="alert"` makes screen readers announce the error when it replaces the page content.
export function PageError({message, onRetry}: PageErrorProps) {
    const {t} = useTranslation();

    return (
        <PageState role="alert">
            <ErrorOutline color="error" fontSize="large"/>
            <Typography>{message}</Typography>
            <Button variant="outlined" onClick={onRetry}>{t("tryAgain")}</Button>
        </PageState>
    );
}
