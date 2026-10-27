import {useLocation} from "react-router";

// Stand-in page for navigation targets: shows where the app went, read with `currentLocation()`.
export function ShowLocation() {
    const {pathname, search, state} = useLocation();
    return <pre data-testid="location">{JSON.stringify({pathname, search, state})}</pre>;
}
