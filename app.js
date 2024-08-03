const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ErrorResponseObject } = require('./common/http');
const routes = require('./routes');
const serverless = require('serverless-http');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(helmet());
app.use('/', routes);

app.all('*', (req, res) => res.status(404).json(new ErrorResponseObject('route not defined')));

module.exports.handler = serverless(app);
console.log("sd")