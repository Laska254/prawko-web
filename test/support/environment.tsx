import {Agent, type Dispatcher, setGlobalDispatcher} from "undici";
import {builtinEnvironments, type Environment} from "vitest/runtime";

const {jsdom} = builtinEnvironments;

// Sends each request on a connection of its own, closed after the response.
export const closeEachConnection: Dispatcher.DispatcherComposeInterceptor = dispatch => (request, handler) =>
    dispatch({...request, reset: true}, handler);

// jsdom, with each request on a connection of its own. MSW sometimes misses a request written to a kept-alive
// connection just as the previous response ends, and it then goes to the real network
// (https://github.com/mswjs/interceptors/issues/862). jsdom takes the global dispatcher when it's created, which is
// before the setup files run. Vitest needs the environment as the default export.
export default {
    ...jsdom,
    name: "jsdom-without-keep-alive",
    setup(global, options) {
        setGlobalDispatcher(new Agent().compose(closeEachConnection));
        return jsdom.setup(global, options);
    },
} satisfies Environment;
