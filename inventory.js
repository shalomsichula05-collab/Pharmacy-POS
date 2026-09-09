const express = require("express");
const {
    sql,
    poolPromise
} = require("./db.js");

const { authenticate } = require("./auth.js");
const router = express.Router();
//add stock
router.post("/", authenticate, async (req, res) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        const { productId, batchNumber, quantity, expiryDate, costPrice, supplier
        } = req.body;
        await transaction.begin();
        const inventoryResult =
            await transaction
                .request()

                .input(
                    "ProductId",
                    sql.Int,
                    productId)

                .input(
                    "BatchNumber",
                    sql.NVarChar,
                    batchNumber)

                .input(
                    "Quantity",
                    sql.Int,
                    quantity)

                .input(
                    "ExpiryDate",
                    sql.Date,
                    expiryDate || null)

                .input(
                    "CostPrice",
                    sql.Decimal(18, 2),
                    costPrice || 0)

                .input(
                    "Supplier",
                    sql.NVarChar,
                    supplier)

                .query(`INSERT INTO Inventory(ProductID, BatchNumber, Quantity, ExpiryDate, CostPrice, Supplier)
                    OUTPUT
                        INSERTED.InventoryID
                    VALUES(@productId, @batchNumber, @quantity, @expiryDate, @costPrice, @supplier)`);


        const inventoryId = inventoryResult.recordset[0].InventoryID;
        await transaction
            .request()

            .input(
                "ProductId",
                sql.Int,
                productId)

            .input(
                "InventoryId",
                sql.Int,
                inventoryId)

            .input(
                "PharmacistId",
                sql.Int,
                req.user.id)

            .input(
                "Quantity",
                sql.Int,
                quantity)

            .query(`INSERT INTO InventoryTransactions ( ProductID, InventoryID, PharmacistID,TransactionType, Quantity, Notes)
                VALUES ( @productId, @inventoryId, @pharmacistId,'stock_in', @quantity,'Stock received') `);

        await transaction.commit();
        res.status(201).json({
            message: "Inventory updated" });
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).json({
            message: "Unable to update inventory" });
    }
});

//expired stock
router.get( "/expired",authenticate, async (req, res) => {
    try {
         const pool =
            await poolPromise;
        const result =
            await pool
                .request()
                .query(` SELECT i.InventoryID, i.BatchNumber, i.Quantity, i.ExpiryDate, p.ProductID, p.ProductName
                        FROM Inventory i
                        INNER JOIN Products p
                            ON p.ProductID =
                               i.ProductID
                        WHERE
                            i.ExpiryDate <
                            CAST(GETDATE() AS DATE)
                        AND i.Quantity > 0
                        ORDER BY
                            i.ExpiryDate`);
            res.json( result.recordset );
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Unable to retrieve expired stock" });
        }
    }
);

// remove expired stock
router.post("/:id/expire", authenticate, async (req, res) => {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();
            const result = await transaction
                    .request()

                    .input(
                        "InventoryId",
                        sql.Int,
                        req.params.id
                    )
                    .query(` SELECT * FROM Inventory WITH (UPDLOCK) WHERE InventoryID = @inventoryId `);
            if (result.recordset.length === 0 ) {
                throw new Error(
                    "Inventory record not found"
                ); }
            const Inventory = result.recordset[0];
            if ( Inventory.quantity <= 0 ) {
                throw new Error( "No stock available" );
            }
            await transaction
                .request()
                .input(
                    "InventoryId",
                    sql.Int,
                    req.params.id
                )
                .query(` UPDATE Inventory SET Quantity = 0 WHERE InventoryID = @inventoryId `);
            await transaction
                .request()

                .input(
                    "ProductId",
                    sql.Int,
                    Inventory.productID
                )

                .input(
                    "InventoryId",
                    sql.Int,
                    Inventory.inventoryID
                )

                .input(
                    "PharmacistId",
                    sql.Int,
                    req.user.id
                )

                .input(
                    "Quantity",
                    sql.Int,
                    Inventory.quantity
                )
                .query(`INSERT INTO InventoryTransactions ( ProductID, InventoryID, PharmacistID,TransactionType, Quantity, Notes)
                    VALUES( @productId, @inventoryId, @pharmacistId, 'expired', @quantity, Expired stock removed') `);
            await transaction.commit();
            res.json({
                message: "Expired stock removed" });
        } catch (error) {
            await transaction.rollback();
            console.error(error);
            res.status(400).json({
                message: error.message });
        }
    }

);


module.exports = router;