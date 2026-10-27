import {CircularProgress, Stack} from "@mui/material";

export function PageLoading() {
    return (
        <Stack alignItems="center" justifyContent="center" py={8}>
            <CircularProgress aria-label="Loading"/>
        </Stack>
    );
}
