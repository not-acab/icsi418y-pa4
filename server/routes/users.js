const express = require("express");
const router = express.Router();

/* /api/users (GET) -> Get all registered users */
router.get("/", async (req, res) => {
    const users = req.db.collection("users");

    try {
        /* Get all users, remove passwords, and convert to an array */
        const allUsers = await users
            .find({})
            .project({ password: 0 })
            .toArray();

        /* GET Success */
        res.status(200).json({
            data: allUsers,
            message: "Users retrieved successfully."
        });

    /* Server Error */
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

/* /api/users (POST) -> Create a new user (signup) */
router.post("/", async (req, res) => {
    const users = req.db.collection("users");
    const { firstname, lastname, username, password } = req.body;

    /* Required field is missing */
    if (!username?.trim()) {
        return res.status(400).json({
            message: "All fields are required!"
        });
    }

    try {
        /* Check for username already in db */
        if (await users.findOne({ username })) {
            return res.status(409).json({
                message: "User exists" //must contain "exists" for app validation
            });
        }

        /* Required fields are missing */
        if (!firstname?.trim() || !lastname?.trim() || !password?.trim()) {
        return res.status(400).json({
            message: "All fields are required!"
        });
    }

        /* Add user into db */
        await users.insertOne({
            f_name: firstname.trim(),
            l_name: lastname.trim(),
            username: username.toLowerCase().trim(),
            password: password.trim()
        });

        /* POST Success */
        res.status(201).json({
            message: "User created successfully. Please Login."
        });

    /* Server Error */
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error"
        });
    }
});

/* /api/users/login (POST) -> Login */
router.post("/login", async (req, res) => {
    const users = req.db.collection("users");
    const { username, password } = req.body;

    /* Required field missing */
    /* A blank password is treated as a login attempt */
    if (!username) {
        return res.status(400).json({
            message: "Username and password are required!" 
        });
    }

    try {
        /* Find user by username */
        const user = await users.findOne({ username });

        /* Username not found */
        if (!user) {
            return res.status(401).json({
                message: "User does not exist." //must contain "does not exist" for app validation
            });
        }

        /* Passwords don't match */
        if (user.password !== password) {
            return res.status(401).json({
                message: "Incorrect Password!"
            });
        }

        /* Login Success */
        res.status(200).json({
            /* Return (non-privileged) user information */
            user: {
                _id: user._id,
                username: user.username,
                f_name: user.f_name,
                l_name: user.l_name
            },
            message: "Login successful!"
        });

    /* Server Error */
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;