import { useEffect } from "react";
import Icon from "./Icon";
import closeSrc from "../assets/close.svg";
import "./overlay.css";

/* Overlay Wrapper for components */
const Overlay = ({ onClose, children }) => {
    /* Listen for Escape Key and call onClose */
    useEffect(() => {
        const onKey = (event) => { if (event.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    /* JSX */
    return (
        <div className="overlay"
        /* Call onClose if user clicks anywhere not in this box */
        onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <div className="overlay-dialog" role="dialog">
                {/* Call onClose if they press the close button */}
                <button type="button" className="overlay-close" onClick={onClose}>
                    <Icon src={closeSrc} />
                </button>
                {/* Display children */}
                {children}
            </div>
        </div>
    );
};

export default Overlay;