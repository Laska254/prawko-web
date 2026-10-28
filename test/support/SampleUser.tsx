import axios from "axios";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {userKeys} from "@/api/queryKeys.tsx";
import {apiUrl} from "./server.tsx";

// The request hook pattern: a query reads the user, a mutation changes it and invalidates the users' keys.
export function SampleUser() {
    const queryClient = useQueryClient();
    const user = useQuery({
        queryKey: userKeys.me(),
        queryFn: async () => (await axios.get<{readonly firstName: string}>(apiUrl("/users/me"))).data,
    });
    const rename = useMutation({
        mutationFn: (firstName: string) => axios.patch(apiUrl("/users/1"), {firstName}),
        onSuccess: () => queryClient.invalidateQueries({queryKey: userKeys.all}),
    });

    if (user.isPending) {
        return <p>Loading</p>;
    }
    if (user.isError) {
        return <p>Error</p>;
    }
    return (
        <>
            <p>{user.data.firstName}</p>
            <button type="button" onClick={() => rename.mutate("Anna")}>Rename</button>
        </>
    );
}
