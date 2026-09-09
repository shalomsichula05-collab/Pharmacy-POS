const express = require("express");

const {
    sql,
    poolPromise
} = require("./db.js");

const { authenticate } = require("./auth.js");

const router = express.Router();
//sale logic
router.post( "/", authenticate, async (req, res) => {
        const { customerId, items, paymentMethod
        } = req.body;
        if (!Array.isArray(items) || items.length === 0 ) {
            return res.status(400).json({
                message: "Sale contains no products"
            });
        }
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();
            const productData = [];
            let total = 0;
            for (const item of items) {
                const productResult = await transaction
                        .request()
                        .input(
                            "ProductId",
                            sql.Int,
                            item.productId
                        )

                        .query(` SELECT ProductID, ProductName, SellingPrice, PrescriptionRequired
                            FROM Products
                            WHERE ProductID =
                                  @productId
                              AND Active = 1 `);
                if (
                    productResult.recordset.length === 0
                ) {
                    throw new Error(
                        `Product ${item.productId} not found`
                    );
                }
                const product = productResult.recordset[0];
                const stockResult = await transaction
                        .request()

                        .input(
                            "ProductId",
                            sql.Int,
                            item.productId
                        )

                        .query(` SELECT
                                ISNULL(
                                    SUM(Quantity),
                                    0
                                ) AS AvailableStock
                            FROM Inventory
                            WHERE ProductID = @productId
                              AND Quantity > 0
                              AND
                              (
                                  ExpiryDate IS NULL
                                  OR ExpiryDate >=
                                     CAST(GETDATE() AS DATE)
                              )
                        `);


                const availableStock =
                    Number(
                        stockResult
                            .recordset[0]
                            .AvailableStock
                    );


                if (
                    availableStock <
                    Number(item.quantity)
                ) {

                    throw new Error(
                        `Insufficient stock for ${product.ProductName}`
                    );
                }

                const itemTotal = Number( product.SellingPrice ) * Number(item.quantity);
                total += itemTotal;

                productData.push({
                    item,
                    product
                });
            }
            if (total < 0) {
                throw new Error(
                    "Sale total cannot be negative"
                );
            }

            const saleResult =
                await transaction
                    .request()
                    .input(
                        "CustomerId",
                        sql.Int,
                        customerId
                    )

                    .input(
                        "PharmacistId",
                        sql.Int,
                        req.user.id
                    )

                    .input(
                        "Total",
                        sql.Decimal(18, 2),
                        total
                    )

                    .input(
                        "PaymentMethod",
                        sql.NVarChar,
                        paymentMethod
                    )

                    .query(`
                        INSERT INTO Sales
                        (
                            CustomerID,
                            PharmacistID,
                            Total,
                            PaymentMethod,
                            Status
                        )
                        OUTPUT
                            INSERTED.SaleID
                        VALUES
                        (
                            @customerId,
                            @pharmacistId,
                            @total,
                            @paymentMethod,
                            'completed'
                        ) `);


            const saleId = saleResult.recordset[0].SaleID;
            for (const data of productData) {
                const {
                    item,
                    product
                } = data;
                const itemTotal =Number(product.SellingPrice ) * Number(item.quantity);
                await transaction
                    .request()

                    .input(
                        "SaleId",
                        sql.Int,
                        saleId
                    )

                    .input(
                        "ProductId",
                        sql.Int,
                        item.productId
                    )

                    .input(
                        "Quantity",
                        sql.Int,
                        item.quantity
                    )

                    .input(
                        "UnitPrice",
                        sql.Decimal(18, 2),
                        product.SellingPrice
                    )

                    .input(
                        "Total",
                        sql.Decimal(18, 2),
                        itemTotal
                    )

                    .query(`
                        INSERT INTO SaleItems
                        (
                            SaleID,
                            ProductID,
                            Quantity,
                            UnitPrice,
                            Total
                        )

                        VALUES
                        (
                            @saleId,
                            @productId,
                            @quantity,
                            @unitPrice,
                            @total
                        )
                    `);


                let remaining =
                    Number(item.quantity);

                const batchResult = await transaction.request()

                        .input(
                            "ProductId",
                            sql.Int,
                            item.productId
                        )

                        .query(`
                            SELECT
                                InventoryID,
                                ProductID,
                                Quantity,
                                ExpiryDate

                            FROM Inventory WITH (UPDLOCK)

                            WHERE ProductID =
                                  @productId

                              AND Quantity > 0

                              AND
                              (
                                  ExpiryDate IS NULL
                                  OR ExpiryDate >=
                                     CAST(GETDATE() AS DATE)
                              )

                            ORDER BY
                                CASE
                                    WHEN ExpiryDate IS NULL
                                    THEN 1
                                    ELSE 0
                                END,
                                ExpiryDate ASC
                        `);


                for (
                    const batch
                    of batchResult.recordset
                ) {

                    if (
                        remaining <= 0
                    ) {
                        break;
                    }


                    const deduction =
                        Math.min(
                            remaining,
                            batch.Quantity
                        );


                    await transaction
                        .request()

                        .input(
                            "InventoryId",
                            sql.Int,
                            batch.InventoryID
                        )

                        .input(
                            "Quantity",
                            sql.Int,
                            deduction
                        )

                        .query(`
                            UPDATE Inventory

                            SET
                                Quantity =
                                    Quantity -
                                    @quantity

                            WHERE InventoryID =
                                  @inventoryId
                        `);


                    await transaction
                        .request()

                        .input(
                            "ProductId",
                            sql.Int,
                            item.productId
                        )

                        .input(
                            "InventoryId",
                            sql.Int,
                            batch.InventoryID
                        )

                        .input(
                            "PharmacistId",
                            sql.Int,
                            req.user.id
                        )

                        .input(
                            "Quantity",
                            sql.Int,
                            deduction
                        )

                        .input(
                            "Notes",
                            sql.NVarChar,
                            `Sale ${saleId}`
                        )

                        .query(`
                            INSERT INTO InventoryTransactions
                            (
                                ProductID,
                                InventoryID,
                                PharmacistID,
                                TransactionType,
                                Quantity,
                                Notes
                            )

                            VALUES
                            (
                                @productId,
                                @inventoryId,
                                @pharmacistId,
                                'sale',
                                @quantity,
                                @notes
                            )
                        `);


                    remaining -=
                        deduction;
                }


                if (
                    remaining > 0
                ) {

                    throw new Error(
                        `Inventory changed while processing ${product.ProductName}`
                    );
                }
            }

            await transaction.commit();

            res.status(201).json({

                message: "Sale completed",
                saleId,
                total
            });


        } catch (error) {
            try {
                await transaction.rollback();
            } catch (_) {
                // Transaction may already have rolled back.
            }


            console.error(error);


            res.status(400).json({
                message:
                    error.message
            });
        }
    }
);


module.exports = router;