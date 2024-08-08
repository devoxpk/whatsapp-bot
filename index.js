const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { SuccessResponseObject } = require('../common/http');
const demo = require('./demo.route');
const whatsapp = require('./home.route'); // Adjust the import path to your actual file

const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route setup
app.use('/whatsapp', whatsapp);
app.use('/demo', demo);

app.get('/', (req, res) => res.json(new SuccessResponseObject('express vercel boiler plate')));

const PORT = process.env.PORT || 9008;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
