import {Box, Stack, Typography} from "@mui/material";
import {CheckCircle} from "@mui/icons-material";
import {Logo} from "./Logo.tsx";

const FEATURES = [
    {title: "Official exam format", description: "The exact same exam format as the official one."},
    {title: "Every license category", description: "Practice for all categories."},
    {title: "Track your progress", description: "Review past attempts and see how your scores improve."},
];

export function AuthPagePanel() {
    return (
        <Stack justifyContent="space-between" spacing={4} p={{xs: 3, md: 8}}
               bgcolor="primary.dark" color="common.white">
            <Logo/>
            <Stack spacing={{xs: 3, md: 5}} maxWidth={480}>
                <Typography variant="h3" fontSize={{xs: "1.75rem", md: "3rem"}} fontWeight={700}>
                    Prepare for your driving theory exam.
                </Typography>
                <Stack spacing={{xs: 1.5, md: 3}}>
                    {FEATURES.map(({title, description}) => (
                        <Stack key={title} direction="row" spacing={2}>
                            <CheckCircle sx={{color: "secondary.light"}}/>
                            <Box>
                                <Typography fontWeight={600}>{title}</Typography>
                                <Typography variant="body2" color="grey.300" display={{xs: "none", md: "block"}}>
                                    {description}
                                </Typography>
                            </Box>
                        </Stack>
                    ))}
                </Stack>
            </Stack>
            <Typography variant="body2" color="grey.400" display={{xs: "none", md: "block"}}>© {new Date().getFullYear()} Wojciech Turczak</Typography>
        </Stack>
    );
}
