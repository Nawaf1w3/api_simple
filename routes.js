const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const conn_db = require("./db_conn.js");
const JWT_SECRET = 'NawafAlhomse'; // Use an env variable in production!
const { isAdmin } = require('./middlewares/authmiddleware');



module.exports = function (app) {
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOjEsIm5hbWUiOiJ1c2VyMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczMTA2OTIzMn0.VT0D2rArxBacGNI1c0ivXor54r8corYd_F0L8RgRMIc';

    // Decode the token to inspect its payload
    const decodedToken = jwt.decode(token);
    console.log(decodedToken);
  
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    // Get User Route - Protected by Admin Middleware
    // This route is protected by the admin middleware
    app.get('/token', (req, res) => {
        // If the user passes the isAdmin middleware, this function will execute
        res.send(decodedToken);
    });
    // Get User Route - Protected by Admin Middleware
    app.get('/users', isAdmin, (req, res) => {
        let sql = "SELECT * FROM users";
        conn_db.query(sql, function (err, rows) {
            if (err) {
                console.error('Error fetching users:', err);
                return res.status(500).send('Server error');
            }
            res.send(rows);
        });
    });


    // Create User Route
    app.post('/user/create', (req, res) => {
        const { name, password, email } = req.body;

        // Hash the password before saving to DB
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).send('Server error');
            }

            let sql = `INSERT INTO user (name, password, email) VALUES (?, ?, ?)`;
            
            conn_db.query(sql, [name, hashedPassword, email], function (err, result) {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).send("Error inserting user");
                } else {
                    console.log("User created:", result);
                    res.send("User created successfully");
                }
            });
        });
    });


    app.post('/login', (req, res) => {
        const { name, password } = req.body;
    
        if (!name || !password) {
            return res.status(400).send('Name and password are required');
        }
    
        // Query the database to find the user by name
        const sql = 'SELECT * FROM users WHERE name = ?';
        conn_db.query(sql, [name], (err, results) => {
            if (err) {
                console.error('SQL query error:', err);
                return res.status(500).send('Server error');
            }
    
            if (results.length === 0) {
                return res.status(401).send('Invalid name or password');
            }
    
            const user = results[0];
    
            // Compare the provided password with the hashed password in the database
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Bcrypt compare error:', err);
                    return res.status(500).send('Server error');
                }
    
                if (isMatch) {
                    // Generate the JWT token (without expiration)
                    const token = jwt.sign(
                        { userID: user.id, name: user.name, role: user.role },  // No exp claim here
                        JWT_SECRET
                    );
    
                    // Set the expiration time for the token in the database (e.g., 1 hour from now)
                    const expireableToken = new Date(Date.now() + 3600 * 1000); // 1 hour expiration time
                    conn_db.query(
                        'UPDATE users SET expireable_token = ? WHERE id = ?',
                        [expireableToken, user.id],
                        (err) => {
                            if (err) {
                                console.error('Error updating token in database:', err);
                                return res.status(500).send('Server error');
                            }
    
                            // Send the token back to the frontend
                            res.json({ token });
                        }
                    );
                } else {
                    res.status(401).send('Invalid name or password');
                }
            });
        });
    });
};
