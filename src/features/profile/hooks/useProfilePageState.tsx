import {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router";
import type {ProfilePageState} from "../gitHubLink.tsx";

interface ProfilePageStateHandle extends ProfilePageState {
    // Drops GitHub's code once it's used up or the user cancelled, so linking GitHub again later doesn't send it.
    readonly dropGitHubLink: () => void;
}

// The state the profile was opened with, read once: the browser keeps it for reloads and back navigation, where
// GitHub's code, which works once, mustn't be sent again. So it's cleared from the history entry.
export function useProfilePageState(): ProfilePageStateHandle {
    const location = useLocation();
    const navigate = useNavigate();
    const [state, setState] = useState<ProfilePageState>(() => location.state ?? {});

    useEffect(() => {
        if (location.state) {
            navigate(".", {replace: true, state: null});
        }
    }, [location.state, navigate]);

    function dropGitHubLink(): void {
        setState(({failure}) => ({failure}));
    }

    return {...state, dropGitHubLink};
}
