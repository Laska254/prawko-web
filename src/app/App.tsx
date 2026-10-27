import {AuthPage} from "@/features/auth/pages/AuthPage.tsx";
import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import {HomePage} from "@/features/home/pages/HomePage.tsx";
import {RequireAuth} from "@/features/auth/guards/RequireAuth.tsx";
import {RequireGuest} from "@/features/auth/guards/RequireGuest.tsx";
import {ExamPage} from "@/features/exam/pages/ExamPage.tsx";
import {VerifyEmailPage} from "@/features/auth/pages/VerifyEmailPage.tsx";
import {VerificationSentPage} from "@/features/auth/pages/VerificationSentPage.tsx";
import {ForgotPasswordPage} from "@/features/auth/pages/ForgotPasswordPage.tsx";
import {ResetPasswordPage} from "@/features/auth/pages/ResetPasswordPage.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RequireAuth/>}>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/exam" element={<ExamPage/>}/>
                </Route>
                <Route element={<RequireGuest/>}>
                    <Route path="/auth" element={<AuthPage/>}/>
                </Route>
                <Route path="/auth/verify" element={<VerifyEmailPage/>}/>
                <Route path="/auth/verify/sent" element={<VerificationSentPage/>}/>
                <Route path="/auth/password/forgot" element={<ForgotPasswordPage/>}/>
                <Route path="/auth/password/reset" element={<ResetPasswordPage/>}/>
                <Route path="*" element={<Navigate to="/auth" replace/>}/>
            </Routes>
        </BrowserRouter>
    )
}

export default App
