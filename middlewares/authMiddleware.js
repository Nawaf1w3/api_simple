const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_secret_key'; // Use your own secret key

// Middleware to check if the user has 'admin' role
function isAdmin(req, res, next) {
    const token = req.headers['authorization'];  // Token should be passed in the 'Authorization' header

    if (!token) {
        return res.status(403).send('Token is required');
    }

    // Remove 'Bearer ' from the token string (if it's prefixed)
    const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

    jwt.verify(tokenWithoutBearer, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send('Invalid token');
        }

        // Log the decoded token for debugging
        console.log('Decoded Token:', decoded);


        const { role } = decoded;
        if (role !== 'admin') {
            return res.status(403).send('You do not have access to this resource');
        }
        
        next();
    });
}

module.exports = { isAdmin };
