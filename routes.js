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
    
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOjEsIm5hbWUiOiJ1c2VyMSIsInJvbGUiOiJhZG1pbiIsInVzZXJfdHlwZSI6Imlud29uZXJzIiwiaWF0IjoxNzMyMzc0MTQ3fQ.PLcMKiY_DmpPQljCL-n70jSEzJj_3hBvie8S4oJUv2k";

    // Decode the token to inspect its payload
    const decodedToken = jwt.decode(token);
    console.log(decodedToken);
  
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    
    app.get('/token', (req, res) => {
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
   
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).send('Server error');
            }
    
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

    // Get user details
    app.get('/users/:userId', authenticateToken, async (req, res) => {
        const { userId } = req.params;
        
        try {
            // Query to find user by ID
            const sql = 'SELECT * FROM users WHERE id = ?';
            conn_db.query(sql, [userId], (err, rows) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.status(500).json({ message: 'Server error' });
            }
        
            if (rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
        
            // Exclude sensitive fields like password
            const user = rows[0];
            delete user.password;
        
            res.json(user); // Send user details
            });
        } catch (error) {
            console.error('Error retrieving user details:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    //delete user
    app.delete('/users/:id', isAdmin, (req, res) => {
        const userId = req.params.id;
    
        let sql = "DELETE FROM users WHERE id = ?";
        conn_db.query(sql, [userId], (err) => {
            if (err) {
                console.error('Error deleting user:', err);
                return res.status(500).send('Server error');
            }
            res.send({ message: 'Gebruiker succesvol verwijderd' });
        });
    });

    //user update
    app.put('/users/:id', isAdmin, (req, res) => {
        const userId = req.params.id;
        const {
            name,
            last_name,
            gender,
            birth_date,
            current_address,
            phone,
            income,
            state,
            email,
            role,
            user_type,
            expireable_token,
            token_expires_at,
            password,
        } = req.body;
    
    
        if (!name || !email || !role) {
            return res.status(400).send("Naam, e-mail en rol zijn verplicht.");
        }
    
   
        const updates = [];
        const values = [];
    
        if (name) {
            updates.push("name = ?");
            values.push(name);
        }
        if (last_name) {
            updates.push("last_name = ?");
            values.push(last_name);
        }
        if (gender) {
            updates.push("gender = ?");
            values.push(gender);
        }
        if (birth_date) {
            updates.push("birth_date = ?");
            values.push(birth_date);
        }
        if (current_address) {
            updates.push("current_address = ?");
            values.push(current_address);
        }
        if (phone) {
            updates.push("phone = ?");
            values.push(phone);
        }
        if (income) {
            updates.push("income = ?");
            values.push(income);
        }
        if (state) {
            updates.push("state = ?");
            values.push(state);
        }
        if (email) {
            updates.push("email = ?");
            values.push(email);
        }
        if (role) {
            updates.push("role = ?");
            values.push(role);
        }
        if (user_type) {
            updates.push("user_type = ?");
            values.push(user_type);
        }
        if (expireable_token) {
            updates.push("expireable_token = ?");
            values.push(expireable_token);
        }
        if (token_expires_at) {
            updates.push("token_expires_at = ?");
            values.push(token_expires_at);
        }

        updates.push("updated_at = NOW()");
   
        if (password) {
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    console.error("Error hashing password:", err);
                    return res.status(500).send("Server error");
                }
    
                updates.push("password = ?");
                values.push(hashedPassword);
    
                const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
                values.push(userId);
    
                conn_db.query(sql, values, (err, result) => {
                    if (err) {
                        console.error("Error updating user:", err);
                        return res.status(500).send("Server error.");
                    }
    
                    if (result.affectedRows === 0) {
                        return res.status(404).send("Gebruiker niet gevonden.");
                    }
    
                    res.send({ message: "Gebruiker succesvol bijgewerkt." });
                });
            });
        } else {
            const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
            values.push(userId);
    
            conn_db.query(sql, values, (err, result) => {
                if (err) {
                    console.error("Error updating user:", err);
                    return res.status(500).send("Server error.");
                }
    
                if (result.affectedRows === 0) {
                    return res.status(404).send("Gebruiker niet gevonden.");
                }
    
                res.send({ message: "Gebruiker succesvol bijgewerkt." });
            });
        }
    });
    

    //log in 
    app.post('/login', (req, res) => {
        const { name, password } = req.body;
        console.log('Login request received with:', req.body); 
    
        if (!name || !password) {
            console.log('Name or password missing'); 
            return res.status(400).send('Name and password are required');
        }
    
        const sql = 'SELECT * FROM users WHERE name = ?';
        console.log('Executing SQL query:', sql, 'with parameters:', [name]); 
    
        conn_db.query(sql, [name], (err, results) => {
            if (err) {
                console.error('SQL query error:', err);
                return res.status(500).send('Server error');
            }
    
            if (results.length === 0) {
                console.log('No user found with the given name');
                return res.status(401).send('Invalid name or password');
            }
    
            const user = results[0];
            console.log('User found:', user); 
    
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Bcrypt compare error:', err);
                    return res.status(500).send('Server error');
                }
    
                if (isMatch) {
                    console.log('Password matched for user:', user.name); 
    
                    const token = jwt.sign(
                        { userID: user.id, name: user.name, role: user.role, user_type: user.user_type },
                        JWT_SECRET
                    );
                    console.log('Generated token:', token); 
    
                    const expireableToken = new Date(Date.now() + 3600 * 1000); 
                    conn_db.query(
                        'UPDATE users SET token_expires_at = ?, expireable_token = ? WHERE id = ?',
                        [expireableToken, token, user.id],
                        (err) => {
                            if (err) {
                                console.error('Error updating token in database:', err);
                                return res.status(500).send('Server error');
                            }
    
                            console.log('Token updated for user ID:', user.id); 
                            res.json({ token });
                        }
                    );
                } else {
                    console.log('Password mismatch for user:', user.name); 
                    res.status(401).send('Invalid name or password');
                }
            });
        });
    });
    

    //create tickts
    app.post('/tickets', authenticateToken, (req, res) => {
        const user_id = req.user.id; 
        const { title, problem_details, type, house_id } = req.body;
    

        if (!title || !problem_details || !type) {
            return res.status(400).json({ error: 'Title, problem details, and type are required fields.' });
        }

        if (!['repair', 'quotation'].includes(type)) {
            return res.status(400).json({ error: "Type must be 'repair' or 'quotation'." });
        }

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

    //show tickts
    app.put('/tickets', isAdmin,(req, res) => {
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
        const user_id = req.user.id; 
        const { title, discription, city, price, post_cod, street } = req.body;
    

        if (!title || !discription || !city || !price  || !post_cod || !street) {
            return res.status(400).json({ error: 'Alle velden zijn verplicht: title, city, price, post_cod, en street.' });
        }
    

        if (price <= 0) {
            return res.status(400).json({ error: 'Prijs moet een positief getal zijn.' });
        }
    

        const sql = `
            INSERT INTO houses (title, discription, city, price, post_cod, street, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
    
        conn_db.query(  
            sql,
            [title, discription, city, price, post_cod, street],
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
        const { city, maxPrice, title } = req.query; 
        let sql = 'SELECT * FROM houses WHERE 1=1';
        const params = [];
    
        if (city) {
            const cities = city.split(','); 
            sql += ` AND city IN (${cities.map(() => '?').join(',')})`;
            params.push(...cities);
        }
    
        if (maxPrice) {
            sql += ' AND price <= ?';
            params.push(maxPrice);
        }
    
        if (title) {
            sql += ' AND title LIKE ?';
            params.push(`%${title}%`);
        }
    
        conn_db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Error fetching houses:', err);
                return res.status(500).json({ error: 'Server error' });
            }
            res.json(results);
        });
    });
    

    // Retrieve unique cities
    app.get('/houses/cities', (req, res) => {
        const sql = 'SELECT DISTINCT city FROM houses';

        conn_db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching cities:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            const cities = results.map(row => row.city);
            res.json(cities);
        });
    });
    
    //update house
    app.patch('/houses/:id', (req, res) => {
        const { id } = req.params; 
        const { title, discription, city, price, post_cod, street } = req.body;
    

        console.log('PATCH request received for ID:', id);
        console.log('Request body:', req.body);
    

        if (!title || !discription || !city || !price || !post_cod || !street) {
            return res.status(400).json({ error: 'Alle velden zijn verplicht: title, discription, city, price, post_cod, en street.' });
        }
    
    
        if (price <= 0) {
            return res.status(400).json({ error: 'Prijs moet een positief getal zijn.' });
        }
    

        const sql = `
            UPDATE houses
            SET title = ?, discription = ?, city = ?, price = ?, post_cod = ?, street = ?, updated_at = NOW()
            WHERE id = ?
        `;
    
        conn_db.query(sql, [title, discription, city, price, post_cod, street, id], (err, result) => {
            if (err) {
                console.error('Error updating house:', err);
                return res.status(500).json({ error: 'Server error' });
            }
    
            console.log('SQL result:', result);
    
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Huis niet gevonden.' });
            }
    
            res.status(200).json({ message: 'Huis succesvol aangepast' });
        });
    });

    // Retrieve a single house by ID
    app.get('/houses/:id', (req, res) => {
        const { id } = req.params; 

        const sql = `
            SELECT * 
            FROM houses 
            WHERE id = ?
        `;

        conn_db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('Error fetching house:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: 'Huis niet gevonden.' });
            }

            res.json(result[0]);
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

    //show avilable houses by filter
    app.get('/houses/view', (req, res) => {
        const { location, maxPrice, minRooms } = req.query;
    
        let filteredHouses = houses;
    
        if (location) {
            filteredHouses = filteredHouses.filter(house => house.city.toLowerCase().includes(location.toLowerCase()));
        }
        if (maxPrice) {
            filteredHouses = filteredHouses.filter(house => house.price <= parseInt(maxPrice));
        }
        if (minRooms) {
            filteredHouses = filteredHouses.filter(house => house.rooms >= parseInt(minRooms));
        }
    
        res.json(filteredHouses);
    });

    // Create a link between a user and a house
    app.post('/user-houses', isAdmin,(req, res) => {
        const { user_id, house_id } = req.body;

        // Validation
        if (!user_id || !house_id) {
            return res.status(400).send("user_id en house_id zijn verplicht.");
        }

        const sql = `INSERT INTO user_houses (user_id, house_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`;

        conn_db.query(sql, [user_id, house_id], (err, result) => {
            if (err) {
                console.error("Error linking user to house:", err);
                return res.status(500).send("Server error.");
            }

            res.status(201).send({ message: "Gebruiker succesvol gekoppeld aan huis.", id: result.insertId });
        });
    });

 
    // app.get('/user-houses', isAdmin,(req, res) => {
        //     const sql = `SELECT * FROM user_houses`;

        //     conn_db.query(sql, (err, results) => {
        //         if (err) {
        //             console.error("Error fetching user-house links:", err);
        //             return res.status(500).send("Server error.");
        //         }

        //         res.send(results);
        //     });
    // });


   // Retrieve all links between users and houses
   
    app.get('/user-houses', isAdmin, (req, res) => {
        const sql = `
            SELECT u.name AS user_name, h.title, u.email, u.role, u.user_type
            FROM user_houses uh
            JOIN users u ON uh.user_id = u.id
            JOIN houses h ON uh.house_id = h.id
        `;
    
        conn_db.query(sql, (err, results) => {
            if (err) {
                console.error("Error fetching user-house links:", err);
                return res.status(500).send("Server error.");
            }
    
            res.send(results);
        });
    });
    

    // Retrieve a specific link by id
    app.get('/user-houses/:id', isAdmin,(req, res) => {
        const { id } = req.params;

        const sql = `SELECT * FROM user_houses WHERE id = ?`;

        conn_db.query(sql, [id], (err, results) => {
            if (err) {
                console.error("Error fetching user-house link:", err);
                return res.status(500).send("Server error.");
            }

            if (results.length === 0) {
                return res.status(404).send("Koppeling niet gevonden.");
            }

            res.send(results[0]);
        });
    });

    // Update the user_houses as wich house is the user renting
    app.put('/user-houses/:id', isAdmin,(req, res) => {
        const { id } = req.params;
        const { user_id, house_id } = req.body;

        if (!user_id || !house_id) {
            return res.status(400).send("user_id en house_id zijn verplicht.");
        }

        const sql = `UPDATE user_houses SET user_id = ?, house_id = ?, updated_at = NOW() WHERE id = ?`;

        conn_db.query(sql, [user_id, house_id, id], (err, result) => {
            if (err) {
                console.error("Error updating user-house link:", err);
                return res.status(500).send("Server error.");
            }

            if (result.affectedRows === 0) {
                return res.status(404).send("Koppeling niet gevonden.");
            }

            res.send({ message: "Koppeling succesvol bijgewerkt." });
        });
    });

    // Delete a specific link by ID
    app.delete('/user-houses/:id', isAdmin,(req, res) => {
        const { id } = req.params;

        const sql = `DELETE FROM user_houses WHERE id = ?`;

        conn_db.query(sql, [id], (err, result) => {
            if (err) {
                console.error("Error deleting user-house link:", err);
                return res.status(500).send("Server error.");
            }

            if (result.affectedRows === 0) {
                return res.status(404).send("Koppeling niet gevonden.");
            }

            res.send({ message: "Koppeling succesvol verwijderd." });
        });
    });

    // Retrieve all houses linked to a specific user
    app.get('/user-houses/user/:userId', isAdmin,(req, res) => {
        const { userId } = req.params;

        const sql = `
            SELECT h.*
            FROM houses h
            INNER JOIN user_houses uh ON h.id = uh.house_id
            WHERE uh.user_id = ?
        `;

        conn_db.query(sql, [userId], (err, results) => {
            if (err) {
                console.error("Error fetching houses for user:", err);
                return res.status(500).send("Server error.");
            }

            if (results.length === 0) {
                return res.status(404).send("Geen huizen gevonden voor deze gebruiker.");
            }

            res.send(results);
        });
    });

    //show the loged in user house
    app.get('/user-houses/me', authenticateToken, (req, res) => {
        const userId = req.user.id;
    
        const sql = `
            SELECT h.*
            FROM houses h
            INNER JOIN user_houses uh ON h.id = uh.house_id
            WHERE uh.user_id = ?
        `;
    
        conn_db.query(sql, [userId], (err, results) => {
            if (err) {
                console.error("Error fetching houses for current user:", err);
                return res.status(500).send("Server error.");
            }
    
            if (results.length === 0) {
                return res.status(404).send("Geen huizen gevonden voor de huidige gebruiker.");
            }
    
            res.send(results);
        });
    });
    
};