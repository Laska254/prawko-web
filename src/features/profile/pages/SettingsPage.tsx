import {Stack, Typography} from "@mui/material";
import {Panel} from "@/components/layout/Panel.tsx";
import {PageEmpty} from "@/components/feedback/PageEmpty.tsx";

export function SettingsPage() {
    return (
        <Stack spacing={3}>
            <Typography variant="h4" component="h1" fontWeight={700}>Settings</Typography>
            <Panel>
                <PageEmpty message="Language, theme and exam preferences will show up here."/>
            </Panel>
        </Stack>
    );
}
