import {Component, type ReactNode} from "react";
import {PageError} from "./PageError.tsx";

interface PageErrorBoundaryProps {
    readonly children: ReactNode;
}

interface PageErrorBoundaryState {
    readonly hasError: boolean;
}

// Shows `PageError` instead of a blank screen when the page fails to render, e.g. its lazy code fails to load.
// React only lets class components catch render errors. Retrying reloads, since `React.lazy` keeps a failed import.
export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
    state: PageErrorBoundaryState = {hasError: false};

    static getDerivedStateFromError(): PageErrorBoundaryState {
        return {hasError: true};
    }

    render() {
        if (this.state.hasError) {
            return (
                <PageError message="This page couldn't be loaded. Check your connection and try again."
                           onRetry={() => window.location.reload()}/>
            );
        }
        return this.props.children;
    }
}
