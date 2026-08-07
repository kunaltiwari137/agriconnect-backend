const mysql = require("mysql2/promise");

require("dotenv").config();


const pool = mysql.createPool({

    host: process.env.DB_HOST,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME

});


// Testing database connection

pool.getConnection()
.then(connection => {

    console.log("✅ MySQL Database Connected");

    connection.release();

})
.catch(error => {

    console.log("❌ Database Connection Failed");
    console.log(error);

});


module.exports = pool;