import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {App} from './App.tsx'
import {ThemeProviders} from "./ThemeProviders.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProviders>
            <App/>
        </ThemeProviders>
    </StrictMode>,
)
