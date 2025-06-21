const express = require('express');
const router = express.Router();
const db = require('../models.db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT dog_id, name, size `
        )
    }
})