import { useState } from "react";
import { Outlet, useNavigate, useNavigation } from "react-router";
import reactLogo from "../assets/react.svg";
import mongoLogo from "../assets/mongodb.svg";
import Loading from "../components/Loading";
import "./Layout.css";

/* Remember the user login across page refreshes */
const STORAGE_KEY = "user";

const Layout = () => {
    const navigate = useNavigate();
    const navigation = useNavigation();

    /* Login state */
    const [user, setUser] = useState(() => sessionStorage.getItem(STORAGE_KEY) ?? "");

    /* Sets the logged-in user */
    const handleLogin = (name) => {
        sessionStorage.setItem(STORAGE_KEY, name);
        setUser(name);
    };

    /* Logs out the user and navigates to the index (Auth) page */
    const handleLogout = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setUser("");
        navigate("/");
    };

    /* Re-evaluated on each render (when state is updated) */
    const isLoggedIn = user !== "";

    /* JSX */
    return (
        <div className="page">
            <header className="page-header">
                <h1>Project 4 - Backlog</h1>
                {!isLoggedIn ? ( <p>Create an account or Sign in.</p> ) : (
                    <p>Welcome back, {user}!{" "}
                        <button type="button" className="logout" onClick={handleLogout}>
                            Log out
                        </button>
                    </p>
                )}
            </header>

            {navigation.state === "loading" && <Loading />}
            <Outlet context={{ isLoggedIn, onLogin: handleLogin }} />

            <footer className="tech-stack">
                <div className="tech-stack-row">
                    <img src={reactLogo} alt="" className="tech-stack-logo" />
                    <span>Built with React</span>
                </div>
                <div className="tech-stack-row">
                    <img src={mongoLogo} alt="" className="tech-stack-logo" />
                    <span>Powered by MongoDB</span>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
