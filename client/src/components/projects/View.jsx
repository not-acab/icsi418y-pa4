import { useNavigate } from "react-router";
import Icon from "../Icon";
import pencilSrc from "../../assets/pencil.svg";
import storySrc from "../../assets/user-story.svg";
import "./projects.css";

/* One project card. Completed projects are greyed out. */
const View = ({ project, onManage }) => {
    const isCompleted = project.status === "Completed";
    const nav = useNavigate();

    return (
        <article className={`project-card${isCompleted ? " is-completed" : ""}`}>
            <header className="project-card-head">
                <h3>{project.name}</h3>
                <span className={`status status-${String(project.status).toLowerCase()}`}>{project.status}</span>
            </header>
            <p className="project-description">{project.description}</p>
            <footer className="project-card-foot">
                <div className="project-lead">
                    <span className="avatar">{`${project.lead?.f_name[0]}${project.lead?.l_name[0] ?? ""}`.toUpperCase()}</span>
                    <div className="project-lead-text">
                        <span className="label">Project Lead</span>
                        <span className="name">{`${project.lead.f_name} ${project.lead.l_name}`.trim() || "Unknown user"}</span>
                        <span className="handle">@{project.lead.username}</span>
                    </div>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => onManage(project._id)}>
                    <Icon src={pencilSrc} />
                    Manage Members
                </button>
                <button type="button" className="btn btn-primary" onClick={() => nav(`/backlog/${project._id}`)}>
                    <Icon src={storySrc} />
                    View User Stories
                </button>
            </footer>
        </article>
    );
};

export default View;
