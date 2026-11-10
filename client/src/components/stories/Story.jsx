import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import threeDotsSrc from "../../assets/three-dots.svg";
import pencilSrc from "../../assets/pencil.svg";
import trashSrc from "../../assets/trash.svg";
import "./stories.css";

/* Full name of a user object, or "Unassigned" */
const displayName = (user) => {
    if (!user) return "Unassigned";
    return `${user.f_name ?? ""} ${user.l_name ?? ""}`.trim();
};

/* CSS-friendly class name: "In Progress" -> "in-progress" */
const toCSS = (text) => String(text).toLowerCase().replace(/\s+/g, "-");

/* One story in the backlog, with a three dot menu (Edit / Delete) */
const Story = ({ story, onEdit, onDelete }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const rootRef = useRef(null);

    /* While open: close on outside click or Escape */
    useEffect(() => {
        if (!menuOpen) return;
        const onMouseDown = (event) => {
            if (!rootRef.current?.contains(event.target)) setMenuOpen(false);
        };
        const onKey = (event) => { if (event.key === "Escape") setMenuOpen(false); };
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [menuOpen]);

    const choose = (action) => {
        setMenuOpen(false);
        action(story._id);
    };

    return (
        <li className={`story-card${story.status === "Done" ? " is-done" : ""}`}>
            <header className="story-head">
                <h3>{story.title}</h3>
                <div className="story-menu" ref={rootRef}>
                    <button
                        type="button"
                        className="story-menu-button"
                        aria-label={`Actions for ${story.title}`}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        <Icon src={threeDotsSrc} />
                    </button>
                    {menuOpen && (
                        <div className="story-menu-list" role="menu">
                            <button type="button" role="menuitem" className="story-menu-item" onClick={() => choose(onEdit)}>
                                <Icon src={pencilSrc} />
                                Edit
                            </button>
                            <button type="button" role="menuitem" className="story-menu-item is-danger" onClick={() => choose(onDelete)}>
                                <Icon src={trashSrc} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="story-badges">
                <span className={`story-badge priority-${toCSS(story.priority)}`}>{story.priority} priority</span>
                <span className={`story-badge story-status-${toCSS(story.status)}`}>{story.status}</span>
            </div>

            <p className="story-description">{story.description}</p>

            <footer className="story-foot">
                <span className="label">Assigned</span>
                <span className={story.assigned_user ? "story-assignee" : "story-assignee is-unassigned"}>
                    {displayName(story.assigned_user)}
                </span>
            </footer>
        </li>
    );
};

export default Story;
