const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');  // Assuming you're using mysql for database

const app = express();
const port = 3001;
app.use(bodyParser.json());
require('./routes.js')(app);

app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`)
})