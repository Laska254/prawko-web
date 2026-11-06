// A small typed wrapper over Google Identity Services, the script of Google's that renders its sign-in button and hands
// over an ID token: https://developers.google.com/identity/gsi/web/reference/js-reference

const SCRIPT_URL = "https://accounts.google.com/gsi/client";

export interface GoogleButtonOptions {
    readonly theme: "outline" | "filled_black";
    readonly text: "continue_with";
    readonly width: number;
    readonly locale?: string;
}

export interface GoogleIdentityConfig {
    readonly client_id: string;
    readonly callback: (response: {readonly credential: string}) => void;
}

export interface GoogleIdentity {
    initialize(config: GoogleIdentityConfig): void;
    renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
}

declare global {
    interface Window {
        // Set by the script once it has loaded.
        google?: {readonly accounts: {readonly id: GoogleIdentity}};
    }
}

// Google is told of one callback, once per page load, so this forwards to whichever page is showing the button.
let credentialListener: ((idToken: string) => void) | undefined;

// Calls `listener` with the ID token of each sign-in through the button, until the returned function is called.
export function onGoogleCredential(listener: (idToken: string) => void): () => void {
    credentialListener = listener;
    return () => {
        credentialListener = undefined;
    };
}

function addScript(clientId: string): HTMLScriptElement {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    // Here, as a script loads only once: Google asks to initialize once per page load.
    script.addEventListener("load", () => window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: ({credential}) => credentialListener?.(credential),
    }));
    // Removed, so opening the page again tries again.
    script.addEventListener("error", () => script.remove());
    document.head.append(script);
    return script;
}

// Resolves once the script is ready; rejects if it can't be loaded, e.g. offline or with a content blocker. Whoever
// calls while it's loading waits for the same script element.
export function loadGoogleIdentity(clientId: string): Promise<GoogleIdentity> {
    return new Promise((resolve, reject) => {
        if (window.google) {
            resolve(window.google.accounts.id);
            return;
        }
        const script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`) ?? addScript(clientId);
        script.addEventListener("load", () => resolve(window.google!.accounts.id));
        script.addEventListener("error", reject);
    });
}
