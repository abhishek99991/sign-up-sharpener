
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


function ensureUsersFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, "[]");
    }
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto.scryptSync(
        password,
        salt,
        64
    ).toString("hex");

    return `${salt}:${hash}`;
}

app.post("/api/signup", (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            password.length < 8 ||
            password.length > 128
        ) {
            return res.status(400).json({
                message: "Enter a valid name, email, and password of 8–128 characters."
            });
        }

        ensureUsersFile();

        const users = JSON.parse(
            fs.readFileSync(USERS_FILE, "utf8")
        );

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = users.find(
            user => user.email === normalizedEmail
        );

        if (existingUser) {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        const newUser = {
            id: crypto.randomUUID(),
            name: name.trim(),
            email: normalizedEmail,
            passwordHash: hashPassword(password)
        };

        users.push(newUser);

        fs.writeFileSync(
            USERS_FILE,
            JSON.stringify(users, null, 2)
        );

        return res.status(201).json({
            message: "Signup successful!",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error("Signup error:", error);

        return res.status(500).json({
            message: "Unable to create your account."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});