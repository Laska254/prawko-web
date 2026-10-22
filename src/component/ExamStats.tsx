import {Box, Stack, Typography} from "@mui/material";
import {AssignmentOutlined, CheckCircleOutline, EmojiEventsOutlined, ShowChart} from "@mui/icons-material";

// Placeholder values until exam history is fetched from prawko-server
const STATS = [
    {label: "Exams taken", value: "0", Icon: AssignmentOutlined, color: "primary"},
    {label: "Passed", value: "0", Icon: CheckCircleOutline, color: "secondary"},
    {label: "Best score", value: "—", Icon: EmojiEventsOutlined, color: "primary"},
    {label: "Average score", value: "—", Icon: ShowChart, color: "primary"},
] as const;

export function ExamStats() {
    return (
        <Box display="grid" gridTemplateColumns={{xs: "1fr 1fr", md: "repeat(4, 1fr)"}} gap={2}>
            {STATS.map(({label, value, Icon, color}) => (
                <Stack key={label} spacing={2} p={3}
                       border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper" boxShadow={1}>
                    <Icon color={color}/>
                    <Box>
                        <Typography variant="h4" fontWeight={700}>{value}</Typography>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                    </Box>
                </Stack>
            ))}
        </Box>
    );
}
