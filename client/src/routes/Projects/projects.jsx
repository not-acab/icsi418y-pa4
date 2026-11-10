import { useState } from "react";
import { Navigate, useLoaderData, useOutletContext, useRevalidator } from "react-router";
import { PROJECT_STATUSES } from "../../api";
import Viewer from "../../components/projects/Viewer";
import MultiSelect from "../../components/MultiSelect";
import Icon from "../../components/Icon";
import searchSrc from "../../assets/search.svg";
import filterSrc from "../../assets/filter.svg";
import sortUpSrc from "../../assets/sort-up.svg";
import sortDownSrc from "../../assets/sort-down.svg";
import "./projects.css";

/* Statuses checked when the page opens - Completed projects start hidden */
const DEFAULT_STATUSES = [PROJECT_STATUSES.PLANNING, PROJECT_STATUSES.ACTIVE];

const Projects = () => {
    /* Data loader */
    const { projects, users, membersByProject, error } = useLoaderData();
    const revalidator = useRevalidator();
    /* Search / filter / sort */
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUSES);
    const [sortAsc, setSortAsc] = useState(false);
    /* Navigate to Auth if not logged in */
    const { isLoggedIn } = useOutletContext();
    if (!isLoggedIn) return <Navigate to="/" replace />;

    /* Search Bar */
    const search = query.trim().toLowerCase();
    const visible = projects
        /* First filter by Filter (Planning/Active/Completed) */
        .filter((project) => statusFilter.includes(project.status))
        /* If there is no search display all, else look in the name or desc */
        .filter((project) => !search || [project.name, project.description].some(
            (text) => String(text ?? "").toLowerCase().includes(search)
        ))
        /* Sort by Date (the Date added button toggles direction) */
        .toSorted((a, b) => {
            const order = a._id < b._id ? -1 : a._id > b._id ? 1 : 0;
            return sortAsc ? order : -order;
        });

    /* JSX */
    return (
        <div className="projects">
            <div className="projects-toolbar">
                <label className="projects-search">
                    <Icon src={searchSrc} />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </label>
                <MultiSelect
                    label="Status"
                    icon={filterSrc}
                    options={Object.values(PROJECT_STATUSES)}
                    selected={statusFilter}
                    onChange={setStatusFilter}
                />
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSortAsc((asc) => !asc)}
                    title={`Sort by date added: (${sortAsc ? "Oldest first" : "Newest first"})`}
                >
                    <Icon src={sortAsc ? sortUpSrc : sortDownSrc} />
                    Date Added
                </button>
            </div>
            <Viewer
                projects={visible}
                allProjects={projects}
                users={users}
                membersByProject={membersByProject}
                loading={revalidator.state === "loading"}
                error={error}
                onRefresh={() => revalidator.revalidate()}
            />
        </div>
    );
};

export default Projects;
