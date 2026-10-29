import {Box, Stack, Typography} from "@mui/material";
import {CheckCircle} from "@mui/icons-material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {Logo} from "@/components/Logo.tsx";

const FEATURES: readonly {readonly title: ParseKeys<"auth">; readonly description: ParseKeys<"auth">}[] = [
    {title: "panel.features.examFormat.title", description: "panel.features.examFormat.description"},
    {title: "panel.features.categories.title", description: "panel.features.categories.description"},
    {title: "panel.features.progress.title", description: "panel.features.progress.description"},
];

export function AuthPagePanel() {
    const {t} = useTranslation("auth");

    return (
        <Stack justifyContent="space-between" spacing={4} p={{xs: 3, md: 8}}
               bgcolor="primary.dark" color="common.white">
            <Logo/>
            <Stack spacing={{xs: 3, md: 5}} maxWidth={480}>
                <Typography variant="h3" fontSize={{xs: "1.75rem", md: "3rem"}} fontWeight={700}>
                    {t("panel.headline")}
                </Typography>
                <Stack spacing={{xs: 1.5, md: 3}}>
                    {FEATURES.map(({title, description}) => (
                        <Stack key={title} direction="row" spacing={2}>
                            <CheckCircle sx={{color: "secondary.light"}}/>
                            <Box>
                                <Typography fontWeight={600}>{t(title)}</Typography>
                                <Typography variant="body2" color="grey.300" display={{xs: "none", md: "block"}}>
                                    {t(description)}
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
