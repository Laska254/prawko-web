import {Suspense, useState} from "react";
import {AppBar, Box, Button, Container, IconButton, Stack, Toolbar} from "@mui/material";
import {Menu} from "@mui/icons-material";
import {Link, NavLink, Outlet} from "react-router";
import {Logo} from "@/components/Logo.tsx";
import {PageLoading} from "@/components/feedback/PageLoading.tsx";
import {ThemeModeSwitch} from "@/components/ThemeModeSwitch.tsx";
import {NAV_ITEMS} from "./navItems.tsx";
import {NavDrawer} from "./NavDrawer.tsx";
import {UserMenu} from "./UserMenu.tsx";

// Frame of every signed-in page: the app bar on top (sections move into a drawer below `md`), the page below.
export function SignedInLayout() {
    const [isDrawerOpen, setDrawerOpen] = useState(false);

    return (
        <>
            <AppBar position="sticky" elevation={0} enableColorOnDark
                    sx={{bgcolor: "primary.dark", color: "common.white"}}>
                <Toolbar>
                    <IconButton color="inherit" edge="start" aria-label="Open navigation" aria-expanded={isDrawerOpen}
                                onClick={() => setDrawerOpen(true)} sx={{display: {md: "none"}, mr: 1}}>
                        <Menu/>
                    </IconButton>
                    <Box component={Link} to="/" color="inherit" sx={{textDecoration: "none"}}>
                        <Logo/>
                    </Box>
                    <Stack component="nav" aria-label="Sections" direction="row" spacing={1} ml={4}
                           display={{xs: "none", md: "flex"}}>
                        {NAV_ITEMS.map(({label, to, end}) => (
                            <Button key={to} component={NavLink} to={to} end={end} color="inherit"
                                    sx={{"&.active": {bgcolor: "secondary.main"}}}>
                                {label}
                            </Button>
                        ))}
                    </Stack>
                    <Box flexGrow={1}/>
                    <ThemeModeSwitch color="inherit"/>
                    <UserMenu/>
                </Toolbar>
            </AppBar>
            <NavDrawer open={isDrawerOpen} onClose={() => setDrawerOpen(false)}/>
            <Container component="main" sx={{py: 4}}>
                {/* Inside the layout, so the app bar stays while a page loads. */}
                <Suspense fallback={<PageLoading/>}>
                    <Outlet/>
                </Suspense>
            </Container>
        </>
    );
}
