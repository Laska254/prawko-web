import {CircularProgress} from "@mui/material";
import {PageState} from "./PageState.tsx";

export function PageLoading() {
    return (
        <PageState>
            <CircularProgress aria-label="Loading"/>
        </PageState>
    );
}
