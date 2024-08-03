const { Router } = require('express');
const { SuccessResponseObject } = require('../common/http');

const whatsapp = require('./whatsapp.route');

const r = Router();

r.use('/whatsapp', whatsapp);

r.get('/', (req, res) => res.json(new SuccessResponseObject('express vercel boiler plate')));

module.exports = r;
