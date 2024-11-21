const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

const cors = require('cors');

// Allow requests from your frontend
const corsOptions = {
    origin: 'http://localhost:5173', // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH '], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};

app.use(cors(corsOptions));

// Use bodyParser for request parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const routes = require('./routes.js'); // import your routes

// Set up routes
routes(app);