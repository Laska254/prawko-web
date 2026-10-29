import {Component, type ReactNode} from "react";
import {useTranslation} from "react-i18next";
import {PageError} from "./PageError.tsx";

interface PageErrorBoundaryProps {
    readonly children: ReactNode;
}

interface PageErrorBoundaryState {
    readonly hasError: boolean;
}

// Class components can't use hooks, so the translated error is its own component.
function PageLoadError() {
    const {t} = useTranslation();

    return <PageError message={t("pageLoadFailed")} onRetry={() => window.location.reload()}/>;
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
            return <PageLoadError/>;
        }
        return this.props.children;
    }
}
