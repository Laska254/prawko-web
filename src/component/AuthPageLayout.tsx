import type {ReactNode} from "react";
import {Box, Stack} from "@mui/material";
import {AuthPagePanel} from "./AuthPagePanel.tsx";
import {Logo} from "./Logo.tsx";

interface AuthPageLayoutProps {
    children: ReactNode;
}

export function AuthPageLayout({children}: AuthPageLayoutProps) {
    return (
        <Box display="grid" gridTemplateColumns={{xs: "1fr", md: "1fr 1fr"}} minHeight="100vh">
            <AuthPagePanel/>
            <Stack alignItems="center" justifyContent="center" spacing={4} px={2} py={6}>
                <Box display={{md: "none"}}>
                    <Logo/>
                </Box>
                {children}
            </Stack>
        </Box>
    );
}
