const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const serverless = require('serverless-http');
console.log("Running")
const app = express();
app.use(cors());
app.use(bodyParser.json());

console.log("Server is running");

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('auth_failure', message => {
    console.error('Authentication failure:', message);
});

client.on('disconnected', reason => {
    console.log('Client was logged out:', reason);
});

app.get('/send-message', (req, res) => {
    const { number, message } = req.query;
    if (!number || !message) {
        return res.status(400).send({ error: 'Please provide both number and message' });
    }
    const chatId = `${number}@c.us`;
    client.sendMessage(chatId, message)
        .then(response => res.send({ success: true, response }))
        .catch(err => res.status(500).send({ success: false, error: err.message }));
});

client.on('message', message => {
    console.log(`Received message: ${message.body}`);
});

client.initialize();

module.exports = app;
module.exports.handler = serverless(app);
