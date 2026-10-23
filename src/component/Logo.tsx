import {Box, Stack, Typography} from "@mui/material";
import {DirectionsCarFilled} from "@mui/icons-material";

export function Logo() {
    return (
        <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box display="flex" alignItems="center" justifyContent="center" width={36} height={36}
                 borderRadius={1.5} bgcolor="secondary.main" color="common.white">
                <DirectionsCarFilled fontSize="small"/>
            </Box>
            <Typography variant="h6" fontWeight={700}>Prawko</Typography>
        </Stack>
    );
}
