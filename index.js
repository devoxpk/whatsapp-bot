//require('dotenv').config();
const { makeWASocket, useMultiFileAuthState, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');
//const { createSticker, StickerTypes } = require('wa-sticker-formatter');
const express = require('express');
const app = express();

// Use environment variable for port
const port = process.env.PORT || 9099;

async function connectWhatsapp() {
    const auth = await useMultiFileAuthState("session");
    const socket = makeWASocket({
        printQRInTerminal: true,
        browser: ["DAPABOT", "", ""],
        auth: auth.state,
        logger: pino({ level: "silent" }),
    });

    socket.ev.on("creds.update", auth.saveCreds);
    socket.ev.on("connection.update", async ({ connection }) => {
        if (connection === "open") {
            console.log("BOT WHATSAPP SUDAH SIAP✅ -- BY DAPICODE!");
        } else if (connection === "close") {
            console.log("WhatsApp connection closed. Reconnecting...");
            await connectWhatsapp();
        }
    });

    socket.ev.on("messages.upsert", async ({ messages, type }) => {
        const chat = messages[0];
        const pesan = (chat.message?.extendedTextMessage?.text ?? chat.message?.ephemeralMessage?.message?.extendedTextMessage?.text ?? chat.message?.conversation)?.toLowerCase() || "";
        const command = pesan.split(" ")[0];

        switch (command) {
            case ".ping":
                await socket.sendMessage(chat.key.remoteJid, { text: "Hello World." }, { quoted: chat });
                await socket.sendMessage(chat.key.remoteJid, { text: "Hello World2." });
                break;

            case ".h":
            case ".hidetag":
                const args = pesan.split(" ").slice(1).join(" ");

                if (!chat.key.remoteJid.includes("@g.us")) {
                    await socket.sendMessage(chat.key.remoteJid, { text: "*Command ini hanya bisa di gunakan di grup!!*" }, { quoted: chat });
                    return;
                }

                const metadata = await socket.groupMetadata(chat.key.remoteJid);
                const participants = metadata.participants.map((v) => v.id);

                socket.sendMessage(chat.key.remoteJid, {
                    text: args,
                    mentions: participants
                });

                break;
        }

        if (chat.message?.imageMessage?.caption === '.sticker' && chat.message?.imageMessage) {
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
            await socket.sendMessage(chat.key.remoteJid, { sticker: generateSticker });
        }
    });

    // Setup the Express server
    app.get('/send-message', async (req, res) => {
        const num = req.query.num;
        const msg = req.query.msg;

        if (!num || !msg) {
            return res.status(400).send('Missing "num" or "msg" parameter.');
        }

        try {
            await socket.sendMessage(`${num}@s.whatsapp.net`, { text: msg });
            res.send('Message sent successfully!');
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send('Failed to send message.');
        }
    });

    app.listen(port, () => {
        console.log(`WhatsApp bot server listening at http://localhost:${port}`);
    });
}

connectWhatsapp();