const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const pino = require('pino');
const { makeWASocket, useMultiFileAuthState, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { createSticker, StickerTypes } = require('wa-sticker-formatter');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8080;

// WhatsApp bot status and ID tracking
let botStatus = 'Starting...';
let botID = null;

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

// Express routes (without Google Generative AI functionality)
app.get("/:name", (req, res) => {
  const { name } = req.params;
  res.status(200).send(`Name: ${name}`);
});

app.get("/", (req, res) => {
  res.send(`App is working fine`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!");
});
