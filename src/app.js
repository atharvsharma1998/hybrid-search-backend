/**
 * Application setup for the Express server.
 * 
 * This file initializes the Express application, configures CORS to allow requests
 * from the frontend hosted on Netlify, and sets up the JSON body parser middleware.
 * It also imports and uses the search routes.
 */

const express = require('express');
const cors = require('cors');

const searchRoutes = require('./routes/searchRoutes');

const app = express();

// Configure CORS to allow requests from the specified frontend origin
app.use(cors({
    // origin: 'http://localhost:3001', // Allow requests from this origin

    origin: process.env.CORS_ORIGIN || 'https://hybrid-search.netlify.app', // Allow requests from this origin
    methods: 'GET,POST',             // Allow these HTTP methods
    allowedHeaders: 'Content-Type'   // Allow these headers
}));

// Middleware to parse incoming JSON requests
app.use(express.json());

// Register the search routes with a prefix of /api
app.use('/api', searchRoutes);

// Global Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
