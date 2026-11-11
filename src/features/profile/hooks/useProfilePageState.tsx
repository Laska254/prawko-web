import {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router";
import type {ProfilePageState} from "../gitHubLink.tsx";

// The state the profile was opened with, read once: the browser keeps it for reloads and back navigation, where
// GitHub's code, which works once, mustn't be sent again. So it's cleared from the history entry.
export function useProfilePageState(): ProfilePageState {
    const location = useLocation();
    const navigate = useNavigate();
    const [state] = useState<ProfilePageState>(() => location.state ?? {});

    useEffect(() => {
        if (location.state) {
            navigate(".", {replace: true, state: null});
        }
    }, [location.state, navigate]);

    return state;
}
