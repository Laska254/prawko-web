import {Stack, type StackProps} from "@mui/material";

// Centred column shared by the page loading, error and empty states.
export function PageState(props: StackProps) {
    return (
        <Stack alignItems="center" justifyContent="center" spacing={2} py={8} textAlign="center" {...props}/>
    );
}
