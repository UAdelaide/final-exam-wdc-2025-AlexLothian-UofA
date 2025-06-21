const express = require('express');
const session = require('express-session');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
app.use(morgan('dev'));

// Middleware
app.use(express.json());
app.use(session({
    secret: 'dogwalk-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60
    }
}));
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dogs', dogRoutes)

// Export the app instead of listening here
module.exports = app;