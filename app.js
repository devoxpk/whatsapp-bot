const express = require('express');
const helmet = require('helmet');
const { SuccessResponseObject, ErrorResponseObject } = require('./common/http');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3005;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(helmet());

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth()
});

let qrCodeGenerated = false;
let clientReady = false;

client.on('qr', qr => {
    qrCodeGenerated = true;
    console.log('QR Code received, scan it with your phone');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    clientReady = true;
    console.log('Client is ready!');
});

client.on('auth_failure', message => {
    console.error('Authentication failure:', message);
});

client.on('disconnected', reason => {
    console.log('Client was logged out:', reason);
});

// Route to send message
app.get('/send-message', async (req, res) => {
    const { number, message } = req.query;
    if (!number || !message) {
        return res.status(400).json(new ErrorResponseObject('Please provide both number and message'));
    }

    if (!clientReady) {
        return res.status(503).json(new ErrorResponseObject('Client not ready yet'));
    }

    const chatId = `${number}@c.us`;

    try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Optional delay
        const response = await client.sendMessage(chatId, message);
        res.json(new SuccessResponseObject('Message sent successfully', response));
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json(new ErrorResponseObject('Error sending message', err.message));
    }
});

// Route to check client status
app.get('/status', (req, res) => {
    if (!qrCodeGenerated) {
        return res.json(new SuccessResponseObject('QR Code not yet generated', null));
    }
    if (!clientReady) {
        return res.json(new SuccessResponseObject('Client not yet ready', null));
    }
    res.json(new SuccessResponseObject('Client is ready and QR Code was generated', null));
});

// Catch-all handler for undefined routes
app.all('*', (req, res) => res.status(404).json(new ErrorResponseObject('route not defined')));

// Initialize client and handle errors
client.initialize().catch(err => {
    console.error('Error initializing client:', err);
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
