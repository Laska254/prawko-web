import type {ReactNode} from "react";
import {Box, Stack} from "@mui/material";
import {ThemeModeSwitch} from "@/components/ThemeModeSwitch.tsx";
import {AuthPagePanel} from "./AuthPagePanel.tsx";

interface AuthPageLayoutProps {
    children: ReactNode;
}

export function AuthPageLayout({children}: AuthPageLayoutProps) {
    return (
        <Box display="grid" gridTemplateColumns={{xs: "1fr", md: "1fr 1fr"}}
             gridTemplateRows={{xs: "auto 1fr", md: "1fr"}} minHeight="100vh">
            <AuthPagePanel/>
            <Stack position="relative" alignItems="center" justifyContent="center" px={2} pt={{xs: 8, md: 6}} pb={{xs: 4, md: 6}}>
                <Box position="absolute" top={8} right={8}>
                    <ThemeModeSwitch/>
                </Box>
                {children}
            </Stack>
        </Box>
    );
}
