import {act, fireEvent} from "@testing-library/react";
import type {GoogleButtonOptions, GoogleIdentityConfig} from "@/components/google/googleIdentity.tsx";

export function googleScripts(): NodeListOf<HTMLScriptElement> {
    return document.querySelectorAll<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
}

// Finishes loading the script the app added, which jsdom doesn't fetch, with a stand-in for what it sets up: its button
// is a plain button. Returns what the app asked of it, and a way to sign in through the button.
export function loadGoogleScript() {
    const configs: GoogleIdentityConfig[] = [];
    const buttons: GoogleButtonOptions[] = [];
    window.google = {
        accounts: {
            id: {
                initialize: config => configs.push(config),
                renderButton: (parent, options) => {
                    buttons.push(options);
                    const button = document.createElement("button");
                    button.textContent = "Continue with Google";
                    parent.append(button);
                },
            },
        },
    };
    fireEvent.load(googleScripts()[0]);
    return {
        configs,
        buttons,
        sendCredential: (credential: string) => act(async () => configs[0].callback({credential})),
    };
}

// Fails loading the script the app added.
export function failGoogleScript(): void {
    fireEvent.error(googleScripts()[0]);
}

// Back to a page that hasn't loaded the script.
export function resetGoogleScript(): void {
    for (const script of googleScripts()) {
        script.remove();
    }
    delete window.google;
}
