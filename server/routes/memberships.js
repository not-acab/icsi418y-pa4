const express = require("express");
const { ObjectId } = require("mongodb");

/* This router can see :projectId from the projects router */
const router = express.Router({ mergeParams: true });

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

/* /api/projects/:projectId/members (POST) -> Add a member to a project */
router.post("/", async (req, res) => {
    const users = req.db.collection("users");
    const memberships = req.db.collection("projectmemberships");

    try {
        /* Find Project, else 404 */
        const project = await findProject(req, res);
        if (!project) return;

        /* Required field is missing */
        if (!req.body.user_id) {
            return res.status(400).json({
                message: "Select a user to add."
            });
        }

        /* The user must exist */
        const userId = toObjectId(req.body.user_id);
        const user = userId && await users.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({
                message: "That user does not exist."
            });
        }

        /* A user can only be in a project once */
        if (await memberships.findOne({ project_id: project._id, user_id: user._id })) {
            return res.status(409).json({
                message: `${user.username} is already a member of ${project.name}.`
            });
        }

        /* Add user to ProjectMembership */
        await memberships.insertOne({ project_id: project._id, user_id: user._id });

        /* POST Success */
        res.status(201).json({
            message: `${user.username} was added to ${project.name}.`
        });

    /* Server Error */
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

/* /api/projects/:projectId/members (GET) -> Get all members of a project */
router.get("/", async (req, res) => {
    const memberships = req.db.collection("projectmemberships");

    try {
        /* Find Project, else 404 */
        const project = await findProject(req, res);
        if (!project) return;

        /* Database aggregate pipleine (nosql query) */
        const members = await memberships.aggregate([
            /* Only get entries for the specified project */
            { $match: { project_id: project._id } },
            /* Join with Users collection */
            { $lookup: {
                from: "users",
                localField: "user_id",
                foreignField: "_id",
                as: "user"
            }},
            /* Unpack as "user" array */
            { $unwind: "$user" },
            /* We only want the user objects (ProjectID is known, MembershipID doesnt matter) */
            { $replaceRoot: { newRoot: "$user" } },
            /* Alphabetical order */
            { $sort: { f_name: 1, l_name: 1 } },
            /* Remove password */
            { $unset: "password" }
        ]).toArray();
        /* Lead first, then others alphabetically */
        members.sort((a, b) => project.project_lead_id.equals(b._id) - project.project_lead_id.equals(a._id));

        /* GET Success */
        res.status(200).json({
            data: members,
            message: `Succesfully got all members of ${project.name}.`
        });

    /* Server Error */
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

/* /api/projects/:projectId/members/:userId (DELETE) -> Remove a member from a project */
router.delete("/:userId", async (req, res) => {
    const users = req.db.collection("users");
    const memberships = req.db.collection("projectmemberships");

    try {
        /* Find Project, else 404 */
        const project = await findProject(req, res);
        if (!project) return;

        /* The user must exist */
        const userId = toObjectId(req.params.userId);
        const user = userId && await users.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({
                message: "That user does not exist."
            });
        }

        /* The lead cannot be removed */
        if (project.project_lead_id.equals(user._id)) {
            return res.status(400).json({
                message: "The project lead cannot be removed from the project."
            });
        }

        /* A member who still has stories in THIS project (any status, including Done) cannot be removed */
        const assignedCount = await req.db.collection("userstories").countDocuments({
            project_id: project._id,
            assigned_user_id: user._id
        });
        if (assignedCount > 0) {
            return res.status(409).json({
                message: `${user.username} still has ${assignedCount} ${assignedCount === 1 ? "story" : "stories"} assigned in ${project.name}. ` +
                    "The stories must first be reassigned, unassigned, or deleted."
            });
        }

        /* Remove the membership */
        const result = await memberships.deleteOne({ project_id: project._id, user_id: user._id });

        /* Send an appropriate message if nothing was deleted */
        if (result.deletedCount === 0) {
            res.status(404).json({
                message: `${user.username} is not a member of ${project.name}.`
            });
            return;
        }

        /* DELETE Success */
        res.status(200).json({
            message: `${user.username} was removed from ${project.name}.`
        });

    /* Server Error */
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;
