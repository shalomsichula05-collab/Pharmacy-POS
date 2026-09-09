const express = require("express");
const {
    sql,
    poolPromise
} = require("./db.js");
const { authenticate } = require("./auth.js");
const router = express.Router();
//get prescription
router.get("/customer/:customerId", authenticate, async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool
                    .request()

                    .input(
                        "CustomerId",
                        sql.Int,
                        req.params.customerId
                    )

                    .query(` SELECT * FROM Prescriptions WHERE CustomerID = @customerId
                        ORDER BY
                            PrescriptionDate DESC`);
            res.json(result.recordset);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Unable to retrieve prescriptions"});
        }
    }
);

//add prescription
router.post("/", authenticate, async (req, res) => {
        try {
            const {customerId, prescriberName, prescriptionDate, expiryDate, medication, dosage
            } = req.body;
            const pool = await poolPromise;
            const result = await pool
                    .request()

                    .input(
                        "CustomerId",
                        sql.Int,
                        customerId
                    )

                    .input(
                        "PrescriberName",
                        sql.NVarChar,
                        prescriberName
                    )

                    .input(
                        "PrescriptionDate",
                        sql.Date,
                        prescriptionDate
                    )

                    .input(
                        "ExpiryDate",
                        sql.Date,
                        expiryDate
                    )

                    .input(
                        "Medication",
                        sql.NVarChar,
                        medication
                    )

                    .input(
                        "Dosage",
                        sql.NVarChar,
                        dosage
                    )
        
                    .query(`INSERT INTO Prescriptions (CustomerID, PrescriberName, PrescriptionDate, ExpiryDate, Medication, Dosage)
                        OUTPUT
                            INSERTED.PrescriptionID
                        VALUES( @customerId, @prescriberName, @prescriptionDate, @expiryDate, @medication, @dosage)`);
            res.status(201).json({
                message: "Prescription recorded",
                prescriptionId: result.recordset[0].PrescriptionID});
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message:"Unable to save prescription"
            });
        }
    }
);


module.exports = router;
