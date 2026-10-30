import {type ReactElement, StrictMode} from "react";
import {render, screen} from "@testing-library/react";
import {MemoryRouter, parsePath, Route, Routes} from "react-router";
import {QueryClientProvider} from "@tanstack/react-query";
import {createQueryClient} from "@/api/queryClient.tsx";
import {ThemeProviders} from "@/app/ThemeProviders.tsx";
import {SessionProvider} from "@/session/SessionProvider.tsx";
import {ShowLocation} from "./ShowLocation.tsx";

interface RenderOptions {
    readonly route?: string;
    readonly state?: unknown;
}

// The app's query client, retrying at once instead of waiting for the backoff.
export function createTestQueryClient() {
    const queryClient = createQueryClient();
    const defaults = queryClient.getDefaultOptions();
    queryClient.setDefaultOptions({...defaults, queries: {...defaults.queries, retryDelay: 0}});
    return queryClient;
}

// Same providers as main.tsx, with a fresh query client (so no test sees another's cache). For `App`, which brings its
// own router. Returns the client too, to check its cache.
export function renderWithoutRouter(ui: ReactElement) {
    const queryClient = createTestQueryClient();
    const result = render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <SessionProvider>
                    <ThemeProviders>
                        {ui}
                    </ThemeProviders>
                </SessionProvider>
            </QueryClientProvider>
        </StrictMode>
    );
    return {...result, queryClient};
}

// Same providers as main.tsx, with a router starting at `route` (and `state`).
export function renderWithProviders(ui: ReactElement, {route = "/", state}: RenderOptions = {}) {
    return renderWithoutRouter(
        <MemoryRouter initialEntries={[{...parsePath(route), state}]}>
            {ui}
        </MemoryRouter>
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
