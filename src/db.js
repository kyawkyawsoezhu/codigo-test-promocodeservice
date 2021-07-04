const mysql = require('mysql');
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

const db = () => {
    if (connection) {
        return connection;
    } else {
        return connection.connect();
    }
};

module.exports = db;
