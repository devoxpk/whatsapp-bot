const express = require('express');


const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve HTML content at the root route
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Express Vercel Boilerplate</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background-color: #f0f0f0;
                }
                h1 {
                    color: #333;
                }
            </style>
        </head>
        <body>
            <h1>Welcome to Express Vercel Boilerplate</h1>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 9008;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
