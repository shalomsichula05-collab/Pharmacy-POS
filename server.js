const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

require("dotenv").config();

const authRoutes = require("./routes.js");
const customerRoutes = require("./customers.js");
const productRoutes = require("./products.js");
const prescriptionRoutes = require("./prescriptions.js");
const inventoryRoutes = require("./inventory.js");
const salesRoutes = require("./sales.js");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(express.static(__dirname));

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);

app.get("/api/health", (_, res) => {
  res.json({
    status: "OK",
    application: "Pharmacy POS",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Pharmacy POS running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
