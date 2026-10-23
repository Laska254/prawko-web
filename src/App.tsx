import {AuthPage} from "./page/AuthPage.tsx";
import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import {ChangePassword} from "./component/ChangePassword.tsx";
import {HomePage} from "./page/HomePage.tsx";
import {RequireAuth} from "./component/RequireAuth.tsx";
import {RequireGuest} from "./component/RequireGuest.tsx";
import {ExamPage} from "./page/ExamPage.tsx";
import {VerifyEmailPage} from "./page/VerifyEmailPage.tsx";

function App() {

    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RequireAuth/>}>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/exam" element={<ExamPage/>}/>
                </Route>
                <Route path="/auth/verify" element={<VerifyEmailPage/>}/>
                <Route element={<RequireGuest/>}>
                    <Route path="/auth" element={<AuthPage/>}/>
                </Route>
                <Route path="/change-password" element={<ChangePassword/>}/>
                <Route path="*" element={<Navigate to="/auth" replace/>}/>
            </Routes>
        </BrowserRouter>
    )

}

export default App
