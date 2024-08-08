const express = require('express');
const router = express.Router();
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Initialize WhatsApp client
const client = new Client();

client.on('qr', qr => {
    console.log('Scan this QR code to log in:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

client.initialize();

router.get('/', async (req, res, next) => {
    try {
        // Send a WhatsApp message
        const number = '923234341354'; // Your number here
        const message = 'Allhamdullilah';
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;

        await client.sendMessage(chatId, message);

        // Respond with success message
        return res.status(200).json({
            title: "Express Testing",
            message: "The app is working properly and the message has been sent!",
        });
    } catch (error) {
        // Handle any errors
        console.error('Error sending WhatsApp message:', error);
        return res.status(500).json({
            title: "Express Testing",
            message: "The app is working, but there was an error sending the message.",
        });
    }
});

module.exports = router;
