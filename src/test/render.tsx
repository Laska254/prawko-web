import type {ReactElement} from "react";
import {render, screen} from "@testing-library/react";
import {CssBaseline, ThemeProvider} from "@mui/material";
import {MemoryRouter, Route, Routes} from "react-router";
import {theme} from "../theme.tsx";
import {ShowLocation} from "./ShowLocation.tsx";

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

// Renders the UI at `route`; any other path shows `ShowLocation`.
export function renderAtRoute(ui: ReactElement, route = "/") {
    return renderWithProviders(
        <Routes>
            <Route path={route.split("?")[0]} element={ui}/>
            <Route path="*" element={<ShowLocation/>}/>
        </Routes>,
        {route}
    );
}

export function currentLocation(): {pathname: string; search: string; state: unknown} {
    return JSON.parse(screen.getByTestId("location").textContent ?? "");
}
