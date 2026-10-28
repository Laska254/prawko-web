import {IconButton, Tooltip, useColorScheme} from "@mui/material";
import {BrightnessAuto, DarkMode, LightMode} from "@mui/icons-material";

const MODES = {
    light: {label: "Theme: light", icon: <LightMode/>, next: "dark"},
    dark: {label: "Theme: dark", icon: <DarkMode/>, next: "system"},
    system: {label: "Theme: system", icon: <BrightnessAuto/>, next: "light"},
} as const;

// Cycles light → dark → system; MUI stores the mode in localStorage (`mui-mode`).
export function ThemeModeSwitch() {
    const {mode, setMode} = useColorScheme();
    // `noSsr` on the ThemeProvider sets `mode` from the first render; without it MUI leaves it unset until mounted.
    const {label, icon, next} = MODES[mode!];

    return (
        <Tooltip title={label}>
            <IconButton onClick={() => setMode(next)}>{icon}</IconButton>
        </Tooltip>
    );
}
