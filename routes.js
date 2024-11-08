const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const conn_db = require("./db_conn.js");
const JWT_SECRET = 'your-secret-key'; // Use an env variable in production!
const { isAdmin } = require('./middlewares/authmiddleware');



module.exports = function (app) {
    
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));


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

    // Login Route
    app.post('/login', (req, res) => {
        const { name, password } = req.body;

        if (!name || !password) {
            return res.status(400).send('name and password are required');
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
                    // Generate the JWT token with role and other details in the payload
                    const token = jwt.sign(
                        {
                            userID: user.id,
                            name: user.name,
                            role: user.role, // Include role in the token
                            user_type: user.user_type, // Optionally, include user_type
                        },
                        JWT_SECRET,
                        { expiresIn: '1h' } // Token expires in 1 hour
                    );

                    // Store the generated token in the database (expireable_token column)
                    const tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour expiration time

                    conn_db.query(
                        'UPDATE users SET expireable_token = ?, token_expires_at = ? WHERE id = ?',
                        [token, tokenExpiresAt, user.id],
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
