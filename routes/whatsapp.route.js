console.log("wp");
const { Router } = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { SuccessResponseObject, ErrorResponseObject } = require('../common/http');

const router = Router();

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    console.log('QR Code received, scan it with your phone');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
    const number = '923234341354'; // replace with your number
    const message = 'Allhamdullilah';
    const chatId = `${number}@c.us`;

    client.sendMessage(chatId, message)
        .then(response => console.log('Message sent successfully:', response))
        .catch(err => console.error('Error sending message:', err));
});

client.on('auth_failure', message => {
    console.error('Authentication failure:', message);
});

client.on('disconnected', reason => {
    console.log('Client was logged out:', reason);
});

router.get('/send-message', (req, res) => {
    const { number, message } = req.query;
    if (!number || !message) {
        return res.status(400).json(new ErrorResponseObject('Please provide both number and message'));
    }
    const chatId = `${number}@c.us`;
    client.sendMessage(chatId, message)
        .then(response => res.json(new SuccessResponseObject('Message sent successfully', response)))
        .catch(err => res.status(500).json(new ErrorResponseObject('Error sending message', err.message)));
});

client.initialize().catch(err => {
    console.error('Error initializing client:', err);
});

module.exports = router;
