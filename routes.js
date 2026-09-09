const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
    sql,
    poolPromise
} = require('./db.js');
const router = express.Router();
const { authenticate, requireAdmin } = require("./auth.js");

//login
router.post("/login", async (req, res) => {
    try {
        const {
            username,
            password
        } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input(
                "Username",
                sql.NVarChar,
                username
            )
            .query(`
                SELECT
                    PharmacistID,
                    Username,
                    Password,
                    PFirstName,
                    PLastName,
                    CONCAT(PFirstName, ' ', PLastName) AS FullName,
                    Role
                FROM Pharmacist
                WHERE Username = @Username
                  AND Active = 1`);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const pharmacist = result.recordset[0];

        const passwordCorrect = await bcrypt.compare(
            password,
            pharmacist.Password
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const token = jwt.sign(
            {
                id: pharmacist.PharmacistID,
                username: pharmacist.Username,
                role: pharmacist.Role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        res.cookie(
            "token",
            token,
            {
                httpOnly: true,
                sameSite: "lax",

                secure:
                    process.env.NODE_ENV === "production",

                maxAge:
                    8 * 60 * 60 * 1000
            }
        );

        res.json({
            message: "Login successful",

            pharmacist: {
                id: pharmacist.PharmacistID,
                name: pharmacist.FullName,
                role: pharmacist.Role
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to login"
        });
    }
});

//logout
router.post("/logout", (_req, res) => {

    res.clearCookie("token");

    res.json({
        message: "Logged out successfully"
    });

});

//create pharmacist
router.post(
    "/pharmacists",
    authenticate,
    requireAdmin,
    async (req, res) => {
        const {
            username,
            password,
            firstName,
            lastName,
            role
        } = req.body;

        if (
            !username ||
            !password ||
            !firstName ||
            !lastName ||
            !role
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (!["admin", "pharmacist"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        try {
            const pool = await poolPromise;

            const existing = await pool
                .request()
                .input("Username", sql.NVarChar, username)
                .query(`
                    SELECT PharmacistID
                    FROM Pharmacist
                    WHERE Username = @Username
                `);

            if (existing.recordset.length > 0) {
                return res.status(409).json({
                    message: "A pharmacist with that username already exists"
                });
            }

            const passwordHash = await bcrypt.hash(password, 12);

            await pool
                .request()
                .input("Username", sql.NVarChar, username)
                .input("Password", sql.NVarChar, passwordHash)
                .input("PFirstName", sql.NVarChar, firstName)
                .input("PLastName", sql.NVarChar, lastName)
                .input("Role", sql.NVarChar, role)
                .query(`
                    INSERT INTO Pharmacist
                        (
                            Username,
                            Password,
                            PFirstName,
                            PLastName,
                            Role,
                            Active
                        )
                    VALUES
                        (
                            @Username,
                            @Password,
                            @PFirstName,
                            @PLastName,
                            @Role,
                            1
                        )
                `);

            res.status(201).json({
                message: "Pharmacist created successfully"
            });
        } catch (error) {
            if (error.number === 2601 || error.number === 2627) {
                return res.status(409).json({
                    message: "That username already exists"
                });
            }

            console.error(error);

            res.status(500).json({
                message: "Unable to create pharmacist"
            });
        }
    }
);

module.exports = router;