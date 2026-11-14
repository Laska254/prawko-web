import {useLocation, useNavigationType} from "react-router";

// Stand-in page for navigation targets: shows where the app went, read with `currentLocation()`, and how it went there
// (`PUSH` or `REPLACE`) in `data-navigation-type`.
export function ShowLocation() {
    const {pathname, search, state} = useLocation();
    const navigationType = useNavigationType();
    return (
        <pre data-testid="location" data-navigation-type={navigationType}>
            {JSON.stringify({pathname, search, state})}
        </pre>
    );
}
