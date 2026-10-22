import type {ReactNode} from "react";
import {Box, Stack} from "@mui/material";
import {AuthPagePanel} from "./AuthPagePanel.tsx";

interface AuthPageLayoutProps {
    children: ReactNode;
}

export function AuthPageLayout({children}: AuthPageLayoutProps) {
    return (
        <Box display="grid" gridTemplateColumns={{xs: "1fr", md: "1fr 1fr"}}
             gridTemplateRows={{xs: "auto 1fr", md: "1fr"}} minHeight="100vh">
            <AuthPagePanel/>
            <Stack alignItems="center" justifyContent="center" px={2} py={{xs: 4, md: 6}}>
                {children}
            </Stack>
        </Box>
    );
}
