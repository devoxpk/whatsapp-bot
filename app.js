const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const bodyParser = require('body-parser');
const serverless = require('serverless-http');

// Initialize the Express app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth()
});

// Display QR code in the console
client.on('qr', qr => {
    console.log('QR Code received, scan it with your phone');
    qrcode.generate(qr, { small: true });
});

// Event when client is ready
client.on('ready', () => {
    console.log('Client is ready!');
    // Automatically send a message to the specified number
    const number = '923234341354'; // replace with your number
    const message = 'Allhamdullilah';
    const chatId = `${number}@c.us`;

    client.sendMessage(chatId, message)
        .then(response => console.log('Message sent successfully:', response))
        .catch(err => console.error('Error sending message:', err));
});

// Event when authentication fails
client.on('auth_failure', message => {
    console.error('Authentication failure:', message);
});

// Event when client is disconnected
client.on('disconnected', reason => {
    console.log('Client was logged out:', reason);
});

// Endpoint to send a message
app.get('/api/send-message', (req, res) => {
    const { number, message } = req.query;
    if (!number || !message) {
        return res.status(400).json({ error: 'Please provide both number and message' });
    }
    const chatId = `${number}@c.us`;
    client.sendMessage(chatId, message)
        .then(response => res.json({ success: true, response }))
        .catch(err => res.status(500).json({ success: false, error: err.message }));
});

// Catch-all handler for undefined routes
app.all('*', (req, res) => res.status(404).json({ error: 'Route not defined' }));

// Initialize client and handle errors
client.initialize().catch(err => {
    console.error('Error initializing client:', err);
});

// Export the app for serverless deployment
module.exports.handler = serverless(app);
