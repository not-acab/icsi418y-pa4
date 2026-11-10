const express = require("express");
const { ObjectId } = require("mongodb");

/* This router can see :projectId from the projects router */
const router = express.Router({ mergeParams: true });

/* All valid statuses and priorities */
const PRIORITIES = ["High", "Medium", "Low"];
const STATUSES = ["To Do", "In Progress", "Done"];

/* Object Id Helper (value) -> ObjectId (valid hex) | null (invalid) */
const toObjectId = (value) => {
    const char24_hex = /^[a-f\d]{24}$/i;
    return typeof value === "string" && char24_hex.test(value) ? new ObjectId(value) : null;
};

/* Look up Project Helper -> project | null */
/* ! IMPORTANT ! */
/* DO NOT double write to res, guard for null and return */
const findProject = async (req, res) => {
    const projectId = toObjectId(req.params.projectId);
    const project = projectId && await req.db.collection("projects").findOne({ _id: projectId });
    if (project) return project;

    /* Set 404 message and return null */
    res.status(404).json({
        message: "That project does not exist."
    });
    return null;
};

/* Validate the fields shared by POST and PUT.
   Returns { error: { status, message } } or { fields } with the cleaned values.
   Also verifies that an assigned user exists AND is a member of the project. */
const validateStory = async (req, project, { requireStatus }) => {
    const { title, description, priority, status, assigned_user_id } = req.body ?? {};
    const fail = (code, message) => ({ error: { status: code, message } });

    /* All fields are required (status and assigned_user_id have default values) */
    if (title==null || description==null || priority==null ) return fail(400, "All fields are required.");

    /* Required text must be a nonblank string */
    if (typeof title !== "string" || !title.trim()) return fail(400, "Title is invalid.");
    if (typeof description !== "string" || !description.trim()) return fail(400, "Description is invalid.");

    /* The project of a story can never change */
    if (req.body.project_id !== undefined && String(req.body.project_id) !== String(project._id)) {
        return fail(400, "A story cannot be moved to a different project.");
    }

    /* Priority and status must be one of the supported values */
    if (!PRIORITIES.includes(priority)) {
        return fail(400, `Priority must be one of: ${PRIORITIES.join(", ")}.`);
    }
    if (requireStatus && !STATUSES.includes(status)) {
        return fail(400, `Status must be one of: ${STATUSES.join(", ")}.`);
    }

    /* assigned Id must either be blank or a valid hex of a user in the project */
    let assignedId = null;
    if (assigned_user_id !== undefined && assigned_user_id !== null && assigned_user_id !== "") {
        assignedId = toObjectId(assigned_user_id);
        if (!assignedId) return fail(400, "The assigned user id is invalid.");

        const user = await req.db.collection("users").findOne({ _id: assignedId });
        if (!user) return fail(404, "The assigned user does not exist.");

        const membership = await req.db.collection("projectmemberships")
            .findOne({ project_id: project._id, user_id: assignedId });
        if (!membership) {
            return fail(400, `${user.username} is not a member of ${project.name}, so they cannot be assigned this story.`);
        }
    }

    return {
        fields: {
            title: title.trim(),
            description: description.trim(),
            priority,
            ...(requireStatus ? { status } : {}),
            assigned_user_id: assignedId
        }
    };
};

/* Look up a story that belongs to the project in the URL -> story | null (404 already sent) */
const findStory = async (req, res, project) => {
    const storyId = toObjectId(req.params.storyId);
    if (!storyId) {
        res.status(400).json({ message: "The story id is invalid." });
        return null;
    }
    /* project_id is part of the filter, so a story can only be reached through its own project */
    const story = await req.db.collection("userstories").findOne({ _id: storyId, project_id: project._id });
    if (!story) {
        res.status(404).json({ message: "That story does not exist in this project." });
        return null;
    }
    return story;
};

/* /api/projects/:projectId/stories (GET) -> List all user stories associated with a project */
router.get("/", async (req, res) => {
    const stories = req.db.collection("userstories");

    try {
        /* Find Project, else 404 */
        const project = await findProject(req, res);
        if (!project) return;

        const allStories = await stories.aggregate([
            /* Only stories of this project */
            { $match: { project_id: project._id } },
            /* Newest first */
            { $sort: { _id: -1 } },
            /* Join with Users collection (readable name of the assigned member) */
            { $lookup: {
                from: "users",
                localField: "assigned_user_id",
                foreignField: "_id",
                as: "assigned_user"
            }},
            /* Unpack "assigned_user" (stays missing for Unassigned stories) */
            { $unwind: { path: "$assigned_user", preserveNullAndEmptyArrays: true } },
            /* Remove password */
            { $unset: "assigned_user.password" }
        ]).toArray();

        /* GET Success */
        res.status(200).json({
            data: allStories,
            message: `Successfully got the backlog of ${project.name}.`
        });

    /* Server Error */
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

/* /api/projects/:projectId/stories (POST) -> Add a user story to a project */
router.post("/", async (req, res) => {
    const stories = req.db.collection("userstories");

    try {
        /* Find Project, else 404 */
        const project = await findProject(req, res);
        if (!project) return;

        /* Validate fields and assignment */
        const { error, fields } = await validateStory(req, project, { requireStatus: false });
        if (error) return res.status(error.status).json({ message: error.message });

        /* The backend always starts a story as To Do */
        const story = { project_id: project._id, ...fields, status: STATUSES[0] };
        await stories.insertOne(story);

        /* POST Success */
        res.status(201).json({
            message: `"${story.title}" was added to the backlog of ${project.name}.`
        });

    /* Server Error */
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

/* /api/projects/:projectId/stories/:storyId (PUT) -> save an edited user story */
router.put("/:storyId", async (req, res) => {
    const stories = req.db.collection("userstories");

    try {
        /* Find Project, else 404 */
        const project = await findProject(req, res);
        if (!project) return;

        /* Find Story inside that project, else 400/404 */
        const story = await findStory(req, res, project);
        if (!story) return;

        /* Validate fields and assignment */
        const { error, fields } = await validateStory(req, project, { requireStatus: true });
        if (error) return res.status(error.status).json({ message: error.message });

        /* Update the existing document ($set never touches _id or project_id) */
        await stories.updateOne({ _id: story._id, project_id: project._id }, { $set: fields });

        /* PUT Success */
        res.status(200).json({
            message: `"${fields.title}" was updated.`
        });

    /* Server Error */
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

/* /api/projects/:projectId/stories/:storyId (DELETE) -> delete a user story */
router.delete("/:storyId", async (req, res) => {
    const stories = req.db.collection("userstories");

    try {
        /* Find Project, else 404 */
        const project = await findProject(req, res);
        if (!project) return;

        /* Find Story inside that project, else 400/404 */
        const story = await findStory(req, res, project);
        if (!story) return;

        await stories.deleteOne({ _id: story._id, project_id: project._id });

        /* DELETE Success */
        res.status(200).json({
            message: `"${story.title}" was deleted.`
        });

    /* Server Error */
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
