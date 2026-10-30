import {use} from "react";
import {type Session, SessionContext} from "./session.tsx";

export function useSession(): Session {
    const session = use(SessionContext);
    if (!session) {
        throw new Error("useSession must be used inside SessionProvider.");
    }
    return session;
}
