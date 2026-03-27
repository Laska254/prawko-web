import './App.css'
import LoginForm from "./component/LoginForm.tsx";
import {BrowserRouter, Navigate, Route, Routes} from "react-router";

function App() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginForm/>}/>
                <Route path="*" element={<Navigate to="/login" replace/>}/>
            </Routes>
        </BrowserRouter>
    )
}

export default App
