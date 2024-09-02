const express = require('express');
const cors = require('cors');

const searchRoutes = require('./routes/searchRoutes');

const app = express();
app.use(cors({
    origin: 'http://localhost:3001', // Allow requests from this origin
    methods: 'GET,POST',             // Allow these HTTP methods
    allowedHeaders: 'Content-Type'   // Allow these headers
}));

app.use(express.json());

app.use('/api', searchRoutes);

module.exports = app;
