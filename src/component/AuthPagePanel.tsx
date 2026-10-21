import {Box, Stack, Typography} from "@mui/material";
import {CheckCircle} from "@mui/icons-material";
import {Logo} from "./Logo.tsx";

const FEATURES = [
    {title: "Official exam format", description: "The exact same exam format as official one."},
    {title: "Every licence category", description: "Practice for all categories."},
    {title: "Track your progress", description: "Review past attempts and see how your scores improve."},
];

export function AuthPagePanel() {
    return (
        <Stack display={{xs: "none", md: "flex"}} justifyContent="space-between" p={8}
               bgcolor="primary.dark" color="common.white">
            <Logo/>
            <Stack spacing={5} maxWidth={480}>
                <Typography variant="h3" fontWeight={700}>
                    Prepare for your driving theory exam.
                </Typography>
                <Stack spacing={3}>
                    {FEATURES.map(({title, description}) => (
                        <Stack key={title} direction="row" spacing={2}>
                            <CheckCircle sx={{color: "secondary.light"}}/>
                            <Box>
                                <Typography fontWeight={600}>{title}</Typography>
                                <Typography variant="body2" color="grey.300">{description}</Typography>
                            </Box>
                        </Stack>
                    ))}
                </Stack>
            </Stack>
            <Typography variant="body2" color="grey.400">© {new Date().getFullYear()} Wojciech Turczak</Typography>
        </Stack>
    );
}
