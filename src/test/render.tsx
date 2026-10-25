import type {ReactElement} from "react";
import {render} from "@testing-library/react";
import {CssBaseline, ThemeProvider} from "@mui/material";
import {MemoryRouter} from "react-router";
import {theme} from "../theme.tsx";

interface RenderOptions {
    readonly route?: string;
}

export function renderWithProviders(ui: ReactElement, {route = "/"}: RenderOptions = {}) {
    return render(
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <MemoryRouter initialEntries={[route]}>
                {ui}
            </MemoryRouter>
        </ThemeProvider>
    );
}
