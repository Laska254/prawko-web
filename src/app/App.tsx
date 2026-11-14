import {Suspense} from "react";
import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import {RequireAuth} from "@/features/auth/guards/RequireAuth.tsx";
import {RequireGuest} from "@/features/auth/guards/RequireGuest.tsx";
import {GITHUB_CALLBACK_PATH} from "@/features/auth/gitHubCallback.tsx";
import {GITHUB_LINK_CALLBACK_PATH} from "@/features/profile/gitHubLink.tsx";
import type {ProfilePageState} from "@/features/profile/profilePageState.tsx";
import {PageLoading} from "@/components/feedback/PageLoading.tsx";
import {PageErrorBoundary} from "@/components/feedback/PageErrorBoundary.tsx";
import {SignedInLayout} from "./layout/SignedInLayout.tsx";
import {lazyPage} from "./lazyPage.tsx";

// Signed in
const HomePage = lazyPage(() => import("@/features/home/pages/HomePage.tsx"), "HomePage");
const ExamPage = lazyPage(() => import("@/features/exam/pages/ExamPage.tsx"), "ExamPage");
const HistoryPage = lazyPage(() => import("@/features/exam/pages/HistoryPage.tsx"), "HistoryPage");
const ProfilePage = lazyPage(() => import("@/features/profile/pages/ProfilePage.tsx"), "ProfilePage");
const SettingsPage = lazyPage(() => import("@/features/profile/pages/SettingsPage.tsx"), "SettingsPage");
const LinkGitHubCallbackPage = lazyPage(() => import("@/features/profile/pages/LinkGitHubCallbackPage.tsx"),
    "LinkGitHubCallbackPage");
// Guests
const AuthPage = lazyPage(() => import("@/features/auth/pages/AuthPage.tsx"), "AuthPage");
const GitHubCallbackPage = lazyPage(() => import("@/features/auth/pages/GitHubCallbackPage.tsx"), "GitHubCallbackPage");
// Public
const VerifyEmailPage = lazyPage(() => import("@/features/auth/pages/VerifyEmailPage.tsx"), "VerifyEmailPage");
const VerificationSentPage = lazyPage(() => import("@/features/auth/pages/VerificationSentPage.tsx"),
    "VerificationSentPage");
const ForgotPasswordPage = lazyPage(() => import("@/features/auth/pages/ForgotPasswordPage.tsx"),
    "ForgotPasswordPage");
const ResetPasswordPage = lazyPage(() => import("@/features/auth/pages/ResetPasswordPage.tsx"), "ResetPasswordPage");
const ConfirmAccountDeletionPage = lazyPage(() => import("@/features/auth/pages/ConfirmAccountDeletionPage.tsx"),
    "ConfirmAccountDeletionPage");
const NotFoundPage = lazyPage(() => import("./pages/NotFoundPage.tsx"), "NotFoundPage");

const DELETE_ACCOUNT_STATE: ProfilePageState = {deleteAccount: true};

export function App() {
    return (
        <BrowserRouter>
            <PageErrorBoundary>
                <Suspense fallback={<PageLoading/>}>
                    <Routes>
                        {/* Signed in: guests go to /auth; pages share the app bar layout. */}
                        <Route element={<RequireAuth/>}>
                            <Route element={<SignedInLayout/>}>
                                <Route path="/" element={<HomePage/>}/>
                                <Route path="/exam" element={<ExamPage/>}/>
                                <Route path="/history" element={<HistoryPage/>}/>
                                <Route path="/profile" element={<ProfilePage/>}/>
                                <Route path="/settings" element={<SettingsPage/>}/>
                                <Route path={GITHUB_LINK_CALLBACK_PATH} element={<LinkGitHubCallbackPage/>}/>
                            </Route>
                            {/* The account deletion link of the app's store listing: the profile with its dialog open. */}
                            <Route path="/account/delete"
                                   element={<Navigate to="/profile" replace state={DELETE_ACCOUNT_STATE}/>}/>
                        </Route>
                        {/* Guests: signed-in users go back to the page that sent them here, or home. */}
                        <Route element={<RequireGuest/>}>
                            <Route path="/auth" element={<AuthPage/>}/>
                        </Route>
                        {/* Signing in with GitHub, which sends a signed-in visitor home itself. */}
                        <Route path={GITHUB_CALLBACK_PATH} element={<GitHubCallbackPage/>}/>
                        {/* Public: email links, password recovery and 404, signed in or not. */}
                        <Route path="/auth/verify" element={<VerifyEmailPage/>}/>
                        <Route path="/auth/verify/sent" element={<VerificationSentPage/>}/>
                        <Route path="/auth/password/forgot" element={<ForgotPasswordPage/>}/>
                        <Route path="/auth/password/reset" element={<ResetPasswordPage/>}/>
                        <Route path="/account/delete/confirm" element={<ConfirmAccountDeletionPage/>}/>
                        <Route path="*" element={<NotFoundPage/>}/>
                    </Routes>
                </Suspense>
            </PageErrorBoundary>
        </BrowserRouter>
    )
}
