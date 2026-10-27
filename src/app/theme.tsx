import {createTheme, type Shadows} from "@mui/material";

const defaultShadows = createTheme().shadows;

export const theme = createTheme({
    palette: {
        primary: {main: "#1d4ed8", light: "#60a5fa", dark: "#1e3a8a"},
        secondary: {main: "#15803d", light: "#4ade80", contrastText: "#ffffff"},
        text: {primary: "#0a0a0a", secondary: "#525252"},
        background: {default: "#e8eef7", paper: "#ffffff"},
        divider: "#d3dbe7",
    },
    shape: {borderRadius: 6},
    shadows: defaultShadows.with(1, "0 1px 2px rgba(30, 58, 138, 0.06), 0 8px 24px rgba(30, 58, 138, 0.08)") as Shadows,
    typography: {
        fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
    },
    components: {
        MuiButton: {
            defaultProps: {disableElevation: true},
            styleOverrides: {root: {textTransform: "none", fontWeight: 600}},
        },
    },
});
