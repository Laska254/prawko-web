import {type ReactElement, StrictMode} from "react";
import {render, screen} from "@testing-library/react";
import {MemoryRouter, parsePath, Route, Routes} from "react-router";
import {ThemeProviders} from "@/app/ThemeProviders.tsx";
import {ShowLocation} from "./ShowLocation.tsx";

interface RenderOptions {
    readonly route?: string;
    readonly state?: unknown;
}

// Same providers as main.tsx, with a router starting at `route` (and `state`).
export function renderWithProviders(ui: ReactElement, {route = "/", state}: RenderOptions = {}) {
    return render(
        <StrictMode>
            <ThemeProviders>
                <MemoryRouter initialEntries={[{...parsePath(route), state}]}>
                    {ui}
                </MemoryRouter>
            </ThemeProviders>
        </StrictMode>
    );
}

// Renders the UI at `route`; any other path shows `ShowLocation`.
export function renderAtRoute(ui: ReactElement, route = "/", state?: unknown) {
    return renderWithProviders(
        <Routes>
            <Route path={parsePath(route).pathname} element={ui}/>
            <Route path="*" element={<ShowLocation/>}/>
        </Routes>,
        {route, state}
    );
}

export function currentLocation(): {pathname: string; search: string; state: unknown} {
    return JSON.parse(screen.getByTestId("location").textContent!);
}
