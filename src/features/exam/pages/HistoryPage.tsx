import {Stack, Typography} from "@mui/material";
import {Panel} from "@/components/layout/Panel.tsx";
import {PageEmpty} from "@/components/feedback/PageEmpty.tsx";

export function HistoryPage() {
    return (
        <Stack spacing={3}>
            <Typography variant="h4" component="h1" fontWeight={700}>History</Typography>
            <Panel>
                <PageEmpty message="Your finished exams will show up here."/>
            </Panel>
        </Stack>
    );
}
