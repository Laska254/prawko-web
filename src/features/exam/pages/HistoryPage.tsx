import {Stack, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import {Panel} from "@/components/layout/Panel.tsx";
import {PageEmpty} from "@/components/feedback/PageEmpty.tsx";

export function HistoryPage() {
    const {t} = useTranslation("exam");

    return (
        <Stack spacing={3}>
            <Typography variant="h4" component="h1" fontWeight={700}>{t("history.title")}</Typography>
            <Panel>
                <PageEmpty message={t("history.empty")}/>
            </Panel>
        </Stack>
    );
}
