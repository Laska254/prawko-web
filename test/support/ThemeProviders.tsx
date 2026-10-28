import type {ReactNode} from "react";
import {CssBaseline, ThemeProvider} from "@mui/material";
import {theme} from "@/app/theme.tsx";

interface ThemeProvidersProps {
    children: ReactNode;
}

// The theme providers from main.tsx.
export function ThemeProviders({children}: ThemeProvidersProps) {
    return (
        <ThemeProvider theme={theme} noSsr>
            <CssBaseline/>
            {children}
        </ThemeProvider>
    );
}
