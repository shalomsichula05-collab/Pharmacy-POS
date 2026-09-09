const express = require("express");
const {
    sql,
    poolPromise
} = require("./db.js");
const { authenticate } = require("./auth.js");
const router = express.Router();
//search product
router.get("/search", authenticate, async (req, res) => {
    try {
        const search = `%${req.query.q || ""}%`;

        const pool = await poolPromise;
        const result = await pool.request()
                .input(
                    "search",
                    sql.NVarChar,
                    search
                )

                .query(`SELECT TOP 50 p.ProductID, p.ProductName, p.SellingPrice, p.PrescriptionRequired,
                        ISNULL(
                            SUM(
                                CASE
                                    WHEN i.ExpiryDate IS NULL
                                      OR i.ExpiryDate >= CAST(GETDATE() AS DATE)
                                    THEN i.Quantity
                                    ELSE 0
                                END), 0 ) AS Stock
                    FROM Products p
                    LEFT JOIN Inventory i
                        ON i.ProductID =
                           p.ProductID
                    WHERE p.Active = 1
                      AND
                      ( p.ProductName LIKE @search)
                    GROUP BY p.ProductID, p.ProductName, p.SellingPrice, p.PrescriptionRequired
                    ORDER BY p.ProductName`);
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to search products"
        });
    }
});

//add product
router.post("/", authenticate, async (req, res) => {
    try {
        const { productName, category, prescriptionRequired, sellingPrice
        } = req.body;
        const pool = await poolPromise;
        const result = await pool
                .request()

                .input(
                    "ProductName",
                    sql.NVarChar,
                    productName
                )

                .input(
                    "Category",
                    sql.NVarChar,
                    category
                )

                .input(
                    "PrescriptionRequired",
                    sql.Bit,
                    prescriptionRequired
                )

                .input(
                    "SellingPrice",
                    sql.Decimal(18, 2),
                    sellingPrice
                )
                .query(` INSERT INTO Products ( ProductName, Category, PrescriptionRequired, SellingPrice)
                    OUTPUT
                        INSERTED.ProductID
                    VALUES
                    ( @productName, @category, @prescriptionRequired, @sellingPrice) `);
        res.status(201).json({
            message: "Product created",
            productId: result.recordset[0].ProductID });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to create product" });
    }
});

module.exports = router;
