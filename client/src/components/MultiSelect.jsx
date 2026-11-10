import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import "./multiselect.css";

/* Dropdown where each option is a checkbox.
   selected is an array of option values; onChange receives the new array (in option order). */
const MultiSelect = ({ label, options, selected, onChange, icon }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    /* While open: close on outside click or Escape */
    useEffect(() => {
        if (!open) return;
        const onMouseDown = (event) => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        const onKey = (event) => { if (event.key === "Escape") setOpen(false); };
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    /* Check / uncheck one option */
    const toggle = (option) => {
        const next = new Set(selected);
        if (next.has(option)) next.delete(option);
        else next.add(option);
        onChange(options.filter((o) => next.has(o)));
    };

    /* Text shown on the closed dropdown */
    const summary = selected.length === 0 ? "None"
        : selected.length === options.length ? "All"
        : selected.join(", ");

    /* JSX */
    return (
        <div className="multi-select" ref={rootRef}>
            <button
                type="button"
                className="multi-select-button"
                onClick={() => setOpen((isOpen) => !isOpen)}
            >
                {icon && <Icon src={icon} />}
                <span className="multi-select-summary">{label}: {summary}</span>
                <span className="multi-select-caret"/>
            </button>

            {open && (
                <div className="multi-select-menu" role="group">
                    {options.map((option) => (
                        <label key={option} className="multi-select-option">
                            <input
                                type="checkbox"
                                checked={selected.includes(option)}
                                onChange={() => toggle(option)}
                            />
                            {option}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
