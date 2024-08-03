const { Router } = require('express');
const { SuccessResponseObject } = require('../common/http');

// Import the WhatsApp router
const whatsapp = require('./whatsapp.route');

// Create a new router
const r = Router();

// Use the WhatsApp router for the /whatsapp endpoint
r.use('/whatsapp', whatsapp);

// Default route for verification
r.get('/', (req, res) => res.json(new SuccessResponseObject('express vercel boiler plate')));

module.exports = r;
