const conn_db = require("./db_conn.js");  
const bodyParser = require('body-parser')

module.exports = function (app) {
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: false }))

    app.get('/', (req, res) => {
        res.send('Hello World!')
    });
    app.get('/home', (req, res) => {
        res.send('Home!')
    });
    
    app.get('/user', (req, res) => {

        let sql = "SELECT * FROM user";
        conn_db.query(sql, function (err, rows) {
            if (err) {
                throw err;
            } else {
                res.send(rows)
            }
        })
    });
    // Route definition for /user/create
    app.post('/user/create', function (req, res) {
        let sql = `INSERT INTO user (name, password, email) VALUES (?, ?, ?)`;
        
        const { name, password, email } = req.body;
        
        conn_db.query(sql, [name, password, email], function (err, result) {
            if (err) {
                console.error("Database error:", err);
                res.status(500).send("Error inserting user");
            } else {
                console.log("Query result:", result);
                res.send("User created successfully");
            }
        });
    });
}
