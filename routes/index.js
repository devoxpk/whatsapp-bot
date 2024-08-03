const { Router } = require('express');
const { SuccessResponseObject, ErrorResponseObject } = require('../common/http');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const router = Router();

// WhatsApp client setup
const client = new Client({
    authStrategy: new LocalAuth()
});

let qrCodeGenerated = false;
let clientReady = false;

// Event when QR code is generated
client.on('qr', qr => {
    qrCodeGenerated = true;
    console.log('QR Code received, scan it with your phone');
    qrcode.generate(qr, { small: true });
});

// Event when client is ready
client.on('ready', () => {
    clientReady = true;
    console.log('Client is ready!');
    // Automatically send a message to verify
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
router.get('/send-message', async (req, res) => {
    const { number, message } = req.query;
    if (!number || !message) {
        return res.status(400).json(new ErrorResponseObject('Please provide both number and message'));
    }

    if (!clientReady) {
        return res.status(503).json(new ErrorResponseObject('Client not ready yet'));
    }

    const chatId = `${number}@c.us`;

    try {
        // Optional delay to ensure the client is ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await client.sendMessage(chatId, message);
        res.json(new SuccessResponseObject('Message sent successfully', response));
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json(new ErrorResponseObject('Error sending message', err.message));
    }
});

// Endpoint to check status
router.get('/status', (req, res) => {
    if (!qrCodeGenerated) {
        return res.json(new SuccessResponseObject('QR Code not yet generated', null));
    }
    if (!clientReady) {
        return res.json(new SuccessResponseObject('Client not yet ready', null));
    }
    res.json(new SuccessResponseObject('Client is ready and QR Code was generated', null));
});

// Initialize client and handle errors
client.initialize().catch(err => {
    console.error('Error initializing client:', err);
});

// Default route for verification
router.get('/', (req, res) => res.json(new SuccessResponseObject('express vercel boiler plate')));

module.exports = router;
