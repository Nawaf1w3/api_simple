let mysql = require('mysql');


let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'comfortliving'
});

connection.connect(function (err) {
    if (err) throw err; 
    console.log("Database connected!");
});

module.exports = connection;