import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {QueryClientProvider} from "@tanstack/react-query";
import {createQueryClient} from "@/api/queryClient.tsx";
import "@/i18n/i18n.tsx";
import {SessionProvider} from "@/session/SessionProvider.tsx";
import {App} from './App.tsx'
import {ThemeProviders} from "./ThemeProviders.tsx";

const queryClient = createQueryClient();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <SessionProvider>
                <ThemeProviders>
                    <App/>
                </ThemeProviders>
            </SessionProvider>
        </QueryClientProvider>
    </StrictMode>,
)
