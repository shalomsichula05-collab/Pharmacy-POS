const express = require("express");

const {
    sql,
    poolPromise
} = require("./db.js");

const { authenticate } = require("./auth.js");

const router = express.Router();

//search customer
router.get("/search", authenticate, async (req, res) => {
    try {
        const customerId = Number(
            String(req.query.q || "").trim()
        );

        if (!Number.isInteger(customerId) || customerId <= 0) {
            return res.json([]);
        }

        const pool = await poolPromise;

        const result = await pool
            .request()
            .input("CustomerID", sql.Int, customerId)
            .query(`
                SELECT
                    CustomerID,
                    FirstName,
                    LastName,
                    Phone,
                    DateOfBirth
                FROM Customers
                WHERE CustomerID = @CustomerID
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to search customers"
        });
    }
});

//create customer
router.post("/", authenticate, async (req, res) => {
    try {
        const {firstName, lastName, phone, dateOfBirth} = req.body;

        const pool =
            await poolPromise;
        const result =
            await pool
                .request()

                .input(
                    "FirstName",
                    sql.NVarChar,
                    firstName
                )

                .input(
                    "LastName",
                    sql.NVarChar,
                    lastName
                )

                .input(
                    "Phone",
                    sql.NVarChar,
                    phone
                )

                .input(
                    "DateOfBirth",
                    sql.Date,
                    dateOfBirth || null
                )

                .query(`INSERT INTO Customers(FirstName, LastName, Phone, DateOfBirth)
                    OUTPUT
                        INSERTED.CustomerID
                    VALUES(@firstName, @lastName, @phone, @dateOfBirth)
                `);

        res.status(201).json({
            message: "Customer created",
            customerId: result.recordset[0].CustomerID
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                "Unable to create customer"
        });
    }
});

//update customer
router.put("/:id", authenticate, async (req, res) => {

    try {
        const {firstName, lastName, phone, dateOfBirth
        } = req.body;
        const pool =
            await poolPromise;
        await pool
            .request()

            .input(
                "id",
                sql.Int,
                req.params.id)

            .input(
                "FirstName",
                sql.NVarChar,
                firstName)

            .input(
                "LastName",
                sql.NVarChar,
                lastName)

            .input(
                "Phone",
                sql.NVarChar,
                phone)

            .input(
                "DateOfBirth",
                sql.Date,
                dateOfBirth || null
            )

            .query(`
                UPDATE Customers
                SET FirstName = @firstName, LastName = @lastName, Phone = @phone, DateOfBirth = @dateOfBirth, UpdatedAt = SYSDATETIME()
                WHERE CustomerID = @id `);

        res.json({
            message:
                "Customer updated"});
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to update customer"});
    }
});

//delete customer
router.delete("/:id", authenticate, async (req, res) => {
    try {
        const pool =
            await poolPromise;
        await pool
            .request()

            .input(
                "id",
                sql.Int,
                req.params.id)

            .query(`
                DELETE FROM Customers
                WHERE CustomerID = @id `);
        res.json({
            message:
                "Customer deleted"});
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to delete customer"});
    }
});


module.exports = router;