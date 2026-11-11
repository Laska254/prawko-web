import {useEffect, useRef} from "react";
import {Box, useColorScheme} from "@mui/material";
import {useTranslation} from "react-i18next";
import {GOOGLE_BUTTON_HEIGHT, type GoogleButtonOptions, loadGoogleIdentity, onGoogleCredential} from "./googleIdentity.tsx";

function buttonTheme(colorScheme: string | undefined): GoogleButtonOptions["theme"] {
    if (colorScheme === "dark") {
        return "filled_black";
    }
    return "outline";
}

interface GoogleButtonProps {
    readonly clientId: string;
    // Called with the ID token of each sign-in through the button.
    readonly onCredential: (idToken: string) => void;
    // Told when the script can't be loaded, as the parent then leaves this out; the script isn't tried again until the
    // page is opened again. A state setter, as a new function renders the button again.
    readonly setUnavailable: (isUnavailable: boolean) => void;
    // Blocks the button, e.g. while the ID token is being sent.
    readonly disabled: boolean;
}

// Google's own button, which hands over the ID token. It fills the width of its parent.
export function GoogleButton({clientId, onCredential, setUnavailable, disabled}: GoogleButtonProps) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const {i18n} = useTranslation();
    const {colorScheme} = useColorScheme();
    const locale = i18n.resolvedLanguage;

    // Without dependencies: listens with this render's `onCredential`.
    useEffect(() => onGoogleCredential(onCredential));

    // Google's button is an iframe that doesn't follow the page, so it's rendered again with the new theme or language.
    useEffect(() => {
        const parent = buttonRef.current!;
        let isCurrent = true;
        loadGoogleIdentity(clientId)
            .then(google => {
                if (isCurrent) {
                    parent.replaceChildren();
                    google.renderButton(parent, {
                        theme: buttonTheme(colorScheme),
                        text: "continue_with",
                        width: parent.clientWidth,
                        locale,
                    });
                }
            })
            .catch(() => setUnavailable(true));
        return () => {
            isCurrent = false;
        };
    }, [clientId, colorScheme, locale, setUnavailable]);

    // The height is kept free while the script loads, so the content below doesn't jump.
    // Google's iframe has a light page. On a dark page, a browser paints an opaque white backdrop behind it.
    return (
        <Box ref={buttonRef} display="flex" justifyContent="center" minHeight={GOOGLE_BUTTON_HEIGHT} inert={disabled}
             sx={{colorScheme: "light"}}/>
    );
}
