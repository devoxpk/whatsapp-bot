const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const serverless = require('serverless-http');

// Initialize the Express app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Simple endpoint to test serverless function
app.get('/api/test', (req, res) => {
    res.json({ message: 'OK' });
});

// Catch-all handler for undefined routes
app.all('*', (req, res) => res.status(404).json({ error: 'Route not defined' }));

// Export the app for serverless deployment
module.exports.handler = serverless(app);
