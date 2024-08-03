const { Router } = require('express');
const { SuccessResponseObject } = require('../common/http');

const whatsapp = require('./whatsapp.route'); // Ensure this line is included

const r = Router();

r.use('/whatsapp', whatsapp); // Ensure this line is included


r.get('/', (req, res) => res.json(new SuccessResponseObject('express vercel boiler plate')));

module.exports = r;
