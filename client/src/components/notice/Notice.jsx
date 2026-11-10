import {NOTICE_TYPES} from "./NoticeTypes.js";
import "./notice.css";

/* Feedback message. Pass a ref to scroll to / focus it when it appears. */
const Notice = ({ type, ref, children }) => (
    <p
        ref={ref}
        tabIndex={-1}
        className={`notice ${type}`}
        role={type === NOTICE_TYPES.ERROR ? "alert" : "status"}
    >
        {children}
    </p>
);

export default Notice;
