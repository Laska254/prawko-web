import {type ComponentType, lazy} from "react";

// `React.lazy` needs a default export, but pages use named ones, so the page is picked out by name.
export function lazyPage<K extends string>(load: () => Promise<Record<NoInfer<K>, ComponentType>>, name: K) {
    return lazy(async () => ({default: (await load())[name]}));
}
