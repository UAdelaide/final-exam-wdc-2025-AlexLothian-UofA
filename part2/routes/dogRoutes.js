const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT dog_id, name, size, owner_id
            FROM Dogs
            ORDER BY dog_id`
        );
        res.json(rows);
    } catch (err) {
        console.error('SQL Error:', err);
        res.status(500);
    }
});

module.exports = router;