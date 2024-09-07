require('dotenv').config();
const { makeWASocket, useMultiFileAuthState, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { createSticker, StickerTypes } = require('wa-sticker-formatter');
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3231;
const MODEL_NAME = "gemini-pro";
const API_KEY = 'AIzaSyD0GidvZyvhWOM4zPXdT0KtOMER9ZGTBjs';

// Track the WhatsApp bot status
let botStatus = 'Starting...';
let botID = null; // Initialize a variable to store the bot's ID
let geminiActive = false; // Track whether Gemini AI is active or not

// Function to handle Gemini AI chat
async function runChat(userInput) {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1000,
    };

    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        // ... other safety settings
    ];

    const chat = model.startChat({
        generationConfig,
        safetySettings,
        history: [
            {
                role: "user",
                parts: [{ text: "You are Devox, a friendly assistant for Devox, a business that offers anime embroidery and DTF printed shirts. We provide products like embroided shirts made from high-quality fabric and DTF prints on cotton shirts. Custom designs are available for print on demand shirts but not for embroidery. For more than 20 shirts, customers need to provide an emb DST file. We also offer up to 25% off, free shipping, and 24/7 customer support." }],
            },
            {
                role: "model",
                parts: [{ text: "Hello! Welcome to Devox. My name is Devox. What's your name?" }],
            },
        ],
    });

    const result = await chat.sendMessage(userInput);
    const response = result.response;
    return response.text();
}

// Initialize WhatsApp connection
async function connectWhatsapp() {
    const auth = await useMultiFileAuthState("session");
    const socket = makeWASocket({
        printQRInTerminal: true,
        browser: ["Devox Bot", "", ""],
        auth: auth.state,
        logger: pino({ level: "silent" }),
    });

    socket.ev.on("creds.update", auth.saveCreds);
    socket.ev.on("connection.update", async ({ connection, qr, user }) => {
        if (connection === "open") {
            botStatus = "BOT WHATSAPP SUDAH SIAP✅ -- BY DAPICODE!";
            console.log(botStatus);
            if (user) {
                botID = user.id; // Capture the bot's ID when the connection opens
            }
        } else if (connection === "close") {
            botStatus = "WhatsApp connection closed. Reconnecting...";
            console.log(botStatus);
            setTimeout(() => connectWhatsapp(), 5000);
        }
    });

    socket.ev.on("messages.upsert", async ({ messages, type }) => {
        const chat = messages[0];
        if (!chat) return; // Skip if no messages

        const senderId = chat.key.remoteJid;
        const messageContent = chat.message?.extendedTextMessage?.text 
            ?? chat.message?.ephemeralMessage?.message?.extendedTextMessage?.text 
            ?? chat.message?.conversation;
        
        const pesan = (messageContent || "").toLowerCase();

        // Skip processing messages sent by the bot itself
        if (senderId === botID) {
            return;
        }

        console.log(`Received message: ${pesan} from ${senderId}`);

        if (pesan === '...') {
            geminiActive = true;   
        } else if (pesan === '..') {
            geminiActive = false;
        } else if (geminiActive && pesan) {
            try {
                const response = await runChat(pesan);
                await socket.sendMessage(senderId, { text: response }, { quoted: chat });
            } catch (error) {
                console.error('Error handling chat with Gemini AI:', error);
                await socket.sendMessage(senderId, { text: "Sorry, I encountered an error while processing your message." }, { quoted: chat });
            }
        }

        if (chat.message?.imageMessage?.caption === '.sticker' && chat.message?.imageMessage) {
            try {
                const getMedia = async (msg) => {
                    const messageType = Object.keys(msg?.message)[0];
                    const stream = await downloadContentFromMessage(msg.message[messageType], messageType.replace('Message', ''));
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }

                    return buffer;
                };

                const mediaData = await getMedia(chat);
                const stickerOption = {
                    pack: "DapaSticker",
                    author: "DapiCode",
                    type: StickerTypes.FULL,
                    quality: 50
                };

                const generateSticker = await createSticker(mediaData, stickerOption);
                await socket.sendMessage(senderId, { sticker: generateSticker });
            } catch (error) {
                console.error('Error handling sticker command:', error);
            }
        }
    });

    // Route to handle sending a confirmation message with buttons
    app.get('/send-message', async (req, res) => {
        const { num, msg } = req.query;
        if (!num || !msg) {
            return res.status(400).send('Missing num or msg parameter.');
        }

        const buttonMessage = {
            text: msg,
            buttons: [
                { buttonId: 'confirm_order', buttonText: { displayText: 'Confirm' }, type: 1 },
                { buttonId: 'decline_order', buttonText: { displayText: 'Decline' }, type: 1 }
            ],
            headerType: 1
        };

        try {
            await socket.sendMessage(`${num}@s.whatsapp.net`, buttonMessage);
            res.send('Message sent successfully!');
        } catch (error) {
            console.error('Error sending button message:', error);
            res.status(500).send('Failed to send button message.');
        }
    });

    app.get('/', (req, res) => {
        res.send(`
            <html>
                <body>
                    <h1>WhatsApp bot is running</h1>
                    <p>Status: ${botStatus}</p>
                </body>
            </html>
        `);
    });

    app.listen(port, () => {
        console.log(`WhatsApp bot server listening at http://localhost:${port}`);
    });
}

connectWhatsapp();
