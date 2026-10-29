import {CircularProgress} from "@mui/material";
import {useTranslation} from "react-i18next";
import {PageState} from "./PageState.tsx";

export function PageLoading() {
    const {t} = useTranslation();

    return (
        <PageState>
            <CircularProgress aria-label={t("loading")}/>
        </PageState>
    );
}
