import {queryOptions} from "@tanstack/react-query";
import {userKeys} from "@/api/queryKeys.tsx";
import {getCurrentUser} from "@/api/users.tsx";

// The signed-in user. Fresh until a change to the user invalidates `userKeys`, so the query enabled after `signIn`
// doesn't fetch it again; a screen that has to see changes made elsewhere fetches it again itself.
export const currentUserQuery = queryOptions({queryKey: userKeys.me(), queryFn: getCurrentUser, staleTime: Infinity});
