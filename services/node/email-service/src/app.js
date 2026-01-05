const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const emailRoutes = require('./routes/emailRoutes');
const logger = require('./config/logger');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Body Parser
app.use(bodyParser.json());

// Logging Middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

// Routes
app.use('/', emailRoutes);

// Error Handling
app.use((err, req, res, next) => {
    logger.error('Unhandled Error', { error: err.stack });
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
