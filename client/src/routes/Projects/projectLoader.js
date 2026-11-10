import { request } from "../../api";

/* Route loader - runs before projects render, and again after every refresh */
export const projectsLoader = async () => {
    const empty = { projects: [], users: [], membersByProject: {} };

    /* request() resolves null when the server is unreachable, and ok:false on a server error */
    const [projectsRes, usersRes] = await Promise.all([request("/projects"), request("/users")]);
    if (!projectsRes?.ok || !usersRes?.ok) return { ...empty, error: "Could not load projects." };

    /* Members of every project id */
    const projects = projectsRes.data.data;
    const membersRes = await Promise.all(
        projects.map((project) => request(`/projects/${project._id}/members`))
    );
    if (membersRes.some((res) => !res?.ok)) return { ...empty, error: "Could not load project members." };

    /* Map members to their respective projects */
    const membersByProject = {};
    projects.forEach((project, index) => {
        membersByProject[project._id] = membersRes[index].data.data;
    });
    return { projects, users: usersRes.data.data, membersByProject, error: "" };
};

export default projectsLoader;
