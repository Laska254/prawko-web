import type {ReactNode} from "react";
import {CssBaseline, ThemeProvider} from "@mui/material";
import {theme} from "./theme.tsx";

interface ThemeProvidersProps {
    children: ReactNode;
}

// The theme and global styles; the app is client-only, so `noSsr` reads the stored colour mode on the first render.
export function ThemeProviders({children}: ThemeProvidersProps) {
    return (
        <ThemeProvider theme={theme} noSsr>
            <CssBaseline/>
            {children}
        </ThemeProvider>
    );
}
