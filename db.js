//database connection file for Microsoft SQL Server using mssql package
const sql = require("mssql");
require("dotenv").config();

const config = {
    port: Number(process.env.DB_PORT),
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate:
            process.env.DB_TRUST_SERVER_CERTIFICATE === "true"
    },

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const poolPromise =
    new sql.ConnectionPool(config)
        .connect()
        .then(pool => {
            console.log("Connected to Microsoft SQL Server");
            return pool;
        })
        .catch(error => {
            console.error(
                "SQL Server connection failed:",
                error
            );

            throw error;
        });

module.exports = {
    sql,
    poolPromise
};
