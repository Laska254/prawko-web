import {Box, Button, Container, Stack} from "@mui/material";
import {Logout} from "@mui/icons-material";
import {useNavigate} from "react-router";
import {clearCredentials} from "../auth.tsx";
import {Logo} from "./Logo.tsx";

export function AppHeader() {
    const navigate = useNavigate();

    function onLogout() {
        clearCredentials();
        navigate("/auth");
    }

    return (
        <Box component="header" bgcolor="primary.dark" color="common.white">
            <Container maxWidth="lg">
                <Stack direction="row" alignItems="center" justifyContent="space-between" height={72}>
                    <Logo/>
                    <Button variant="outlined" color="inherit" startIcon={<Logout/>} onClick={onLogout}>
                        Log out
                    </Button>
                </Stack>
            </Container>
        </Box>
    );
}
