import {IconButton, type IconButtonProps, Tooltip, useColorScheme} from "@mui/material";
import {BrightnessAuto, DarkMode, LightMode} from "@mui/icons-material";
import {useTranslation} from "react-i18next";

const MODES = {
    light: {label: "themeMode.light", icon: <LightMode/>, next: "dark"},
    dark: {label: "themeMode.dark", icon: <DarkMode/>, next: "system"},
    system: {label: "themeMode.system", icon: <BrightnessAuto/>, next: "light"},
} as const;

interface ThemeModeSwitchProps {
    // `inherit` on coloured bars such as the app bar.
    readonly color?: IconButtonProps["color"];
}

// Cycles light → dark → system; MUI stores the mode in localStorage (`mui-mode`).
export function ThemeModeSwitch({color}: ThemeModeSwitchProps) {
    const {mode, setMode} = useColorScheme();
    const {t} = useTranslation();
    // MUI passes on whatever `mui-mode` holds (and nothing before mount without `noSsr`), so anything else shows as system.
    const {label, icon, next} = MODES[mode as keyof typeof MODES] ?? MODES.system;

    return (
        <Tooltip title={t(label)}>
            <IconButton color={color} onClick={() => setMode(next)}>{icon}</IconButton>
        </Tooltip>
    );
}
