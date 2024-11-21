const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const conn_db = require("./db_conn.js");
const JWT_SECRET = 'NawafAlhoms'; // Use an env variable in production!
const { isAdmin } = require('./middlewares/authmiddleware');




function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).send('Access Denied');

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).send('Invalid Token');

        // Attach user ID and role to req object for access in routes
        req.user = { id: decoded.userID, role: decoded.role };
        next();
    });
}
module.exports = function (app) {
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOjIsIm5hbWUiOiJ1c2VyMiIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTczMTMyODc0Nn0.yG49BDw-fiMAS-pVEiIY2f-fftZIWzZQhlcDX-49E7A';

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
        const {
            name,
            last_name,
            gender,
            birth_date,
            current_adress,
            phone,
            income,
            state,
            email,
            password
        } = req.body;
    
        // Validate input
        if (!name || !last_name || !gender || !birth_date || !current_adress || !phone || !income || !state || !email || !password) {
            return res.status(400).send('All fields are required');
        }
    
        // Hash the password before saving to the database
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).send('Server error');
            }
    
            // Insert the user into the database
            const sql = `
                INSERT INTO users 
                (name, last_name, gender, birth_date, current_adress, phone, income, state, email, password, role, user_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'customer', 'inwoners')
            `;
    
            conn_db.query(
                sql,
                [
                    name,
                    last_name,
                    gender,
                    birth_date,
                    current_adress,
                    phone,
                    income,
                    state,
                    email,
                    hashedPassword
                ],
                (err, result) => {
                    if (err) {
                        console.error("Database error:", err);
    
                        // Handle unique email constraint violation
                        if (err.code === 'ER_DUP_ENTRY') {
                            return res.status(400).send("Email already exists");
                        }
    
                        return res.status(500).send("Error inserting user");
                    }
    
                    console.log("User created:", result);
                    res.status(201).send("User created successfully");
                }
            );
        });
    });
    
    //log in 
    app.post('/login', (req, res) => {
        const { name, password } = req.body;
        console.log('Login request received with:', req.body); // Log received payload
    
        if (!name || !password) {
            console.log('Name or password missing'); // Log missing credentials
            return res.status(400).send('Name and password are required');
        }
    
        const sql = 'SELECT * FROM users WHERE name = ?';
        console.log('Executing SQL query:', sql, 'with parameters:', [name]); // Log query details
    
        conn_db.query(sql, [name], (err, results) => {
            if (err) {
                console.error('SQL query error:', err);
                return res.status(500).send('Server error');
            }
    
            if (results.length === 0) {
                console.log('No user found with the given name'); // Log no user found
                return res.status(401).send('Invalid name or password');
            }
    
            const user = results[0];
            console.log('User found:', user); // Log user details
    
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Bcrypt compare error:', err);
                    return res.status(500).send('Server error');
                }
    
                if (isMatch) {
                    console.log('Password matched for user:', user.name); // Log successful match
    
                    const token = jwt.sign(
                        { userID: user.id, name: user.name, role: user.role },
                        JWT_SECRET
                    );
                    console.log('Generated token:', token); // Log token
    
                    const expireableToken = new Date(Date.now() + 3600 * 1000); // 1-hour expiration
                    conn_db.query(
                        'UPDATE users SET token_expires_at = ?, expireable_token = ? WHERE id = ?',
                        [expireableToken, token, user.id],
                        (err) => {
                            if (err) {
                                console.error('Error updating token in database:', err);
                                return res.status(500).send('Server error');
                            }
    
                            console.log('Token updated for user ID:', user.id); // Log token update
                            res.json({ token });
                        }
                    );
                } else {
                    console.log('Password mismatch for user:', user.name); // Log password mismatch
                    res.status(401).send('Invalid name or password');
                }
            });
        });
    });
    
    

    //teckit
    app.post('/tickets', authenticateToken, (req, res) => {
        const user_id = req.user.id; // Get the logged-in user's ID from the token
        const { title, problem_details, type, house_id } = req.body;
    
        // Validate required fields
        if (!title || !problem_details || !type) {
            return res.status(400).json({ error: 'Title, problem details, and type are required fields.' });
        }
    
        // Validate the ticket type
        if (!['repair', 'quotation'].includes(type)) {
            return res.status(400).json({ error: "Type must be 'repair' or 'quotation'." });
        }
    
        // Insert ticket into the database
        const sql = `
            INSERT INTO tickets (user_id, title, problem_details, type, house_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;
    
        conn_db.query(sql, [user_id, title, problem_details, type, house_id || null], (err, result) => {
            if (err) {
                console.error('Error inserting ticket:', err);
                return res.status(500).json({ error: 'Server error' });
            }
    
            res.status(201).json({
                message: 'Ticket created successfully',
                ticket_id: result.insertId,
                user_id: user_id,
            });
        });
    });

    //create tickt
    app.put('/tickets', authenticateToken,(req, res) => {
        const sql = `
            SELECT 
                tickets.id, 
                tickets.user_id, 
                tickets.title, 
                tickets.problem_details, 
                tickets.type, 
                tickets.house_id, 
                tickets.created_at, 
                tickets.updated_at, 
                users.name AS user_name, 
                users.email AS user_email
            FROM tickets
            JOIN users ON tickets.user_id = users.id
            ORDER BY tickets.created_at DESC
        `;
    
        conn_db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching tickets:', err);
                return res.status(500).json({ error: 'Server error' });
            }
    
            res.json({
                tickets: results,
            });
        });
    });

    //create house
    app.post('/houses/create', authenticateToken, (req, res) => {
        const user_id = req.user.id; // ID van de ingelogde gebruiker uit de token
        const { title, city, price, post_cod, street } = req.body;
    
        // Validatie van vereiste velden
        if (!title || !city || !price  || !post_cod || !street) {
            return res.status(400).json({ error: 'Alle velden zijn verplicht: title, city, price, post_cod, en street.' });
        }
    
        // Controle op een positieve prijs
        if (price <= 0) {
            return res.status(400).json({ error: 'Prijs moet een positief getal zijn.' });
        }
    
        // SQL-query om het huis toe te voegen
        const sql = `
            INSERT INTO houses (title, city, price, post_cod, street, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?,  NOW(), NOW())
        `;
    
        conn_db.query(
            sql,
            [title, city, price, post_cod, street],
            (err, result) => {
                if (err) {
                    console.error('Error inserting house:', err);
                    return res.status(500).json({ error: 'Server error' });
                }
    
                res.status(201).json({
                    message: 'Huis succesvol aangemaakt',
                    house_id: result.insertId,
                });
            }
        );
    });

    //retrive houses
    app.get('/houses', (req, res) => {
        const query = 'SELECT * FROM houses';
        conn_db.query(query, (err, results) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
          }
          res.json(results);
        });
    });
      
    //update house
    app.patch('/houses/:id', (req, res) => {
        const { id } = req.params; // ID of the house to update
        const { title, city, price, post_cod, street } = req.body; // Fields to update
    
        // Debug logs
        console.log('PATCH request received for ID:', id);
        console.log('Request body:', req.body);
    
        // Validate fields
        if (!title || !city || !price || !post_cod || !street) {
            return res.status(400).json({ error: 'Alle velden zijn verplicht: title, city, price, post_cod, en street.' });
        }
    
        // Ensure the price is positive
        if (price <= 0) {
            return res.status(400).json({ error: 'Prijs moet een positief getal zijn.' });
        }
    
        // SQL query to update the house
        const sql = `
            UPDATE houses
            SET title = ?, city = ?, price = ?, post_cod = ?, street = ?, updated_at = NOW()
            WHERE id = ?
        `;
    
        conn_db.query(sql, [title, city, price, post_cod, street, id], (err, result) => {
            if (err) {
                console.error('Error updating house:', err);
                return res.status(500).json({ error: 'Server error' });
            }
    
            console.log('SQL result:', result); // Debug log
    
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Huis niet gevonden.' });
            }
    
            res.status(200).json({ message: 'Huis succesvol aangepast' });
        });
    });
    

    //delete a house
    app.delete('/houses/:id', (req, res) => {
        const { id } = req.params; // ID of the house to delete
    
        // SQL query to delete the house
        const sql = `
            DELETE FROM houses
            WHERE id = ?
        `;
    
        conn_db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting house:', err);
                return res.status(500).json({ error: 'Server error' });
            }
    
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Huis niet gevonden.' });
            }
    
            res.status(200).json({ message: 'Huis succesvol verwijderd' });
        });
    });
    
    
    
};

