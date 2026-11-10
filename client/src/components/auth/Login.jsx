import { useState, useRef, useEffect } from "react";
import { request } from "../../api";
import { NOTICE_TYPES } from "../notice/NoticeTypes";
import Notice from "../notice/Notice";
import "../forms.css";


const Login = ({ activeCard, setActiveCard, getMessage, sendMessage, onLogin }) => {
    /* Fields */
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    /* Field errors: { field: "hint text" } - a field with an entry is styled as an error and shows its hint */
    const [errors, setErrors] = useState({});
    /* Server Notice: { type, text, showSignupLink } or null */
    const [notice, setNotice] = useState(null);
    /* Button toggle */
    const [submitting, setSubmitting] = useState(false);
    /* Card switching */
    const [lastActiveCard, setLastActiveCard] = useState(activeCard);
    /* Process messages - thank you 412 */
    const [lastMessage, setLastMessage] = useState(getMessage);
    /* Refernce to username input - needed to focus on switch */
    const usernameRef = useRef(null);
    /* Reference to notice element - focus when displayed */
    const noticeRef = useRef(null);

    /* Remove a field's error styling + hint once the user edits it */
    const clearError = (field) => {
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };


    /* Clear card when Signup becomes the active card */
    if (lastActiveCard !== activeCard) {
        setLastActiveCard(activeCard);
        if (activeCard === "signup") {
            setUsername("");
            setPassword("");
            setNotice(null);
            setErrors({});
        }
    }

    /* Fill username sent from Signup */
    if (getMessage !== lastMessage) {
        setLastMessage(getMessage);
        if (getMessage?.to === "login") {
            setUsername(getMessage.username);
            setErrors({});
        }
    }

    /* Focus the username field after getMessage is updated and rendered */
    useEffect(() => {
        if (getMessage?.to === "login") {
            usernameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            usernameRef.current?.focus();
        }
    }, [getMessage]);

    /* Bring a new alert notice into view */
    useEffect(() => {
        if (notice && notice.type === NOTICE_TYPES.ALERT) {
            noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            noticeRef.current?.focus();
        }
    }, [notice]);

    /* Submit Form */
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;

        /* Required fields empty - POST request still sent as per pa2 requirements */
        const cleanUsername = username.toLowerCase().trim();
        const fieldErrors = {
            username: cleanUsername ? "" : "Username is required",
            password: password ? "" : "Password is required"
        };
        setErrors(fieldErrors);
        setNotice(null);

        /* POST Request */
        setSubmitting(true);
        const response = await request("/users/login", {
            method: "POST",
            body: { username: cleanUsername, password }
        }, () => {
            setNotice({ type: NOTICE_TYPES.ERROR, text: "Could not connect to the server" });
        });
        setSubmitting(false);
        if (!response) return;

        /* POST Response - always clear password & set server message */
        const { ok, data } = response;
        const message = data.message ?? "";
        setPassword("");

        if (ok) {
            /* Success styling */
            setNotice({ type: NOTICE_TYPES.SUCCESS, text: message });
            setErrors({});
            /* Tell the parent who logged in  */
            onLogin(data.user?.f_name || cleanUsername);
        } else {
            /* Determine the error */
            const userMissing = message.toLowerCase().includes("does not exist");
            const badPassword = message.toLowerCase().includes("incorrect password");

            /* Add sever error to empty-field hints */
            if (userMissing) {
                setErrors({ ...fieldErrors, username: "No account with that username" });
            } else if (badPassword) {
                setErrors({ ...fieldErrors, password: "Incorrect password" });
            }

            /* A missing user is a prompt to sign up (alert), anything else is an error */
            setNotice({
                type: userMissing ? NOTICE_TYPES.ALERT : NOTICE_TYPES.ERROR,
                text: message,
                showSignupLink: userMissing
            });
        }
    };

    /* JSX */
    return (
        <div className="card">
            <h2>Log In
                <span className="subtitle">-If you're a returning user</span>
            </h2>
            <form onSubmit={handleSubmit} onFocus={() => setActiveCard("login")} noValidate>
                <div className="field">
                    <label htmlFor="login-username">Username</label>
                    <input
                        ref={usernameRef}
                        id="login-username"
                        type="text"
                        autoComplete="username"
                        className={`control ${errors.username ? "error" : ""}`}
                        placeholder="Username"
                        value={username}
                        onChange={(event) => { setUsername(event.target.value); clearError("username"); }}
                    />
                    {errors.username && <span className="field-hint">{errors.username}</span>}
                </div>

                <div className="field">
                    <label htmlFor="login-password">Password</label>
                    <input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        className={`control ${errors.password ? "error" : ""}`}
                        placeholder="Password"
                        value={password}
                        onChange={(event) => { setPassword(event.target.value); clearError("password"); }}
                    />
                    {errors.password && <span className="field-hint">{errors.password}</span>}
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                    {submitting ? "Logging in..." : "Login"}
                </button>
            </form>
            {/* Overwrites message with a hyperlink to Signup */}
            {notice && (
                <Notice ref={noticeRef} type={notice.type}>
                    {notice.showSignupLink ? (
                        <>That user does not exist.{" "}
                            <a href="#signup"
                                className={NOTICE_TYPES.LINK}
                                onClick={(event) => {
                                    event.preventDefault();
                                    sendMessage({ to: "signup", username });
                                }}
                            >Did you mean to Signup?
                            </a>
                        </>
                    ) : notice.text}
                </Notice>
            )}
        </div>
    );
};

export default Login;
