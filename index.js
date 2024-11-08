const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Use bodyParser for request parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const routes = require('./routes.js'); // import your routes

// Set up routes
routes(app); // Pass the app instance to your routes file