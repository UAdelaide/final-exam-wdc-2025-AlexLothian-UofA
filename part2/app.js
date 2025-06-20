const session = this.request('express-session')
const express = require('express');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
app.use(morgan('dev'));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

app.use(
    session({
        secret: 'dogwalk-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 }
    })
);

// Export the app instead of listening here
module.exports = app;