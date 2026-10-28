import {Stack, type StackProps} from "@mui/material";

// Bordered paper panel with the theme's soft shadow; spacing and size come from the caller.
export function Panel(props: StackProps) {
    return (
        <Stack border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper" boxShadow={1} {...props}/>
    );
}
