const jwt = require('jsonwebtoken');
const conn_db = require("../db_conn");
const JWT_SECRET = 'NawafAlhomse';  // Replace with your actual secret key

function isAdmin(req, res, next) {
    // Retrieve the token from Authorization header
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).send('Token is required');
    }

    // Remove the 'Bearer ' prefix if it exists
    const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;

    // Decode the token (without verifying) to inspect the payload
    let decoded;
    try {
        decoded = jwt.decode(tokenWithoutBearer);  // Decode token without verification
    } catch (err) {
        return res.status(401).send('Invalid token');
    }

    // If the decoded token is null or missing, the token is invalid
    if (!decoded) {
        return res.status(401).send('Invalid token');
    }

    // Get the user from the database based on the userID in the decoded token
    const userID = decoded.userID;

    // Query the database to get the user's expiration time (expireable_token)
    const sql = 'SELECT token_expires_at, role FROM users WHERE id = ?';
    conn_db.query(sql, [userID], (err, results) => {
        if (err) {
            return res.status(500).send('Server error');
        }

        if (results.length === 0) {
            return res.status(401).send('User not found');
        }

        const user = results[0];

        // Check if the token has expired by comparing expireable_token with current time
        const now = new Date(); // Current date and time
        const expireableToken = new Date(user.token_expirs_at);  // Expiry time from the database

        if (expireableToken < now) {
            return res.status(401).send('Token has expired');
        }

        // Check if the user has the admin role in the decoded token
        const { role } = decoded;  // Decoded token will have the role

        // If the role is not 'admin', return 403 (Forbidden)
        if (role !== 'admin') {
            return res.status(403).send('You do not have access to this resource');
        }

        // Allow the request to proceed if the role is admin and the token is valid
        next();
    });
}

module.exports = { isAdmin };