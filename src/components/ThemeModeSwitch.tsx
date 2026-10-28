import {IconButton, type IconButtonProps, Tooltip, useColorScheme} from "@mui/material";
import {BrightnessAuto, DarkMode, LightMode} from "@mui/icons-material";

const MODES = {
    light: {label: "Theme: light", icon: <LightMode/>, next: "dark"},
    dark: {label: "Theme: dark", icon: <DarkMode/>, next: "system"},
    system: {label: "Theme: system", icon: <BrightnessAuto/>, next: "light"},
} as const;

interface ThemeModeSwitchProps {
    // `inherit` on coloured bars such as the app bar.
    readonly color?: IconButtonProps["color"];
}

// Cycles light → dark → system; MUI stores the mode in localStorage (`mui-mode`).
export function ThemeModeSwitch({color}: ThemeModeSwitchProps) {
    const {mode, setMode} = useColorScheme();
    // MUI passes on whatever `mui-mode` holds (and nothing before mount without `noSsr`), so anything else shows as system.
    const {label, icon, next} = MODES[mode as keyof typeof MODES] ?? MODES.system;

    return (
        <Tooltip title={label}>
            <IconButton color={color} onClick={() => setMode(next)}>{icon}</IconButton>
        </Tooltip>
    );
}
