var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
    try {
        const connection = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });
        await connection.query('CREATE DATABASE IF NOT EXISTS testdb');
        await connection.end();

        db = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'testdb' });

        await db.execute(`CREATE TABLE IF NOT EXISTS users(
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE,
      email VARCHAR(100),
      password_hash VARCHAR(255),
      role ENUM('owner','walker')
    )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS dogs(
      dog_id INT AUTO_INCREMENT PRIMARY KEY,
      owner_id INT,
      name VARCHAR(50),
      size ENUM('small','medium','large'),
      FOREIGN KEY(owner_id) REFERENCES users(user_id)
    )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS walkrequests(
      request_id INT AUTO_INCREMENT PRIMARY KEY,
      dog_id INT,
      start_datetime DATETIME,
      duration_min INT,
      location VARCHAR(255),
      status ENUM('open','accepted','done'),
      FOREIGN KEY(dog_id) REFERENCES dogs(dog_id)
    )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS ratings(
      rating_id INT AUTO_INCREMENT PRIMARY KEY,
      walker_id INT,
      stars INT,
      FOREIGN KEY(walker_id) REFERENCES users(user_id)
    )`);

        const [u] = await db.execute('SELECT COUNT(*) AS c FROM users');
        if (u[0].c === 0) {
            await db.execute(`INSERT INTO users(username,email,password_hash,role) VALUES
                            ('alice123','alice@example.com','hashed 123','owner'),
                            ('bobwalker','bob@example.com','hashed 456','walker'),
                            ('carol123','carol@example.com','hashed 789','owner'),
                            ('diana8','diana@example.com','hashed 321','owner'),
                            ('ericwalks','eric@example.com','hashed 654','walker')`);
                        }

        const [d] = await db.execute('SELECT COUNT(*) AS c FROM dogs');
        if (d[0].c === 0) {
            await db.execute(`INSERT INTO dogs(owner_id,name,size) VALUES
                            ((SELECT user_id FROM users WHERE username='alice123'),'Max','medium'),
                            ((SELECT user_id FROM users WHERE username='carol123'),'Bella','small'),
                            ((SELECT user_id FROM users WHERE username='carol123'),'Rocky','large'),
                            ((SELECT user_id FROM users WHERE username='alice123'),'Luna','small'),
                            ((SELECT user_id FROM users WHERE username='diana8'),'Buddy','medium')`);
                        }

        const [w] = await db.execute('SELECT COUNT(*) AS c FROM walkrequests');
        if (w[0].c === 0) await db.execute(`INSERT INTO walkrequests(dog_id,start_datetime,duration_min,location,status) VALUES
      ((SELECT dog_id FROM dogs WHERE name='Max'),'2025-06-10 08:00:00',30,'Parklands','open'),
      ((SELECT dog_id FROM dogs WHERE name='Bella'),'2025-06-10 09:30:00',45,'Beachside Ave','accepted'),
      ((SELECT dog_id FROM dogs WHERE name='Luna'),'2025-06-11 10:00:00',60,'City Park','open'),
      ((SELECT dog_id FROM dogs WHERE name='Buddy'),'2025-06-12 07:30:00',45,'River Trail','open'),
      ((SELECT dog_id FROM dogs WHERE name='Rocky'),'2025-06-10 17:00:00',30,'Hilltop Yard','open')`);

        const [r] = await db.execute('SELECT COUNT(*) AS c FROM ratings');
        if (r[0].c === 0) await db.execute(`INSERT INTO ratings(walker_id,stars) VALUES
      ((SELECT user_id FROM users WHERE username='bobwalker'),5),
      ((SELECT user_id FROM users WHERE username='bobwalker'),4)`);}
    } catch (e) {
        console.error('DB setup error', e);
    }
})();

app.get('/api/dogs', async (req, res) => {
    try {
        const [rows] = await db.execute(`
      SELECT d.name AS dog_name,d.size,u.username AS owner_username
      FROM dogs d JOIN users u ON d.owner_id=u.user_id
    `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: 'failed' });
    }
});

app.get('/api/walkrequests/open', async (req, res) => {
    try {
        const [rows] = await db.execute(`
      SELECT w.request_id,d.name AS dog_name,w.start_datetime AS requested_time,
      w.duration_min AS duration_minutes,w.location,u.username AS owner_username
      FROM walkrequests w
      JOIN dogs d ON w.dog_id=d.dog_id
      JOIN users u ON d.owner_id=u.user_id
      WHERE w.status='open'
    `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: 'failed' });
    }
});

app.get('/api/walkers/summary', async (req, res) => {
    try {
        const [rows] = await db.execute(`
      SELECT u.username AS walker_username,
      COUNT(r.rating_id) AS total_ratings,
      AVG(r.stars) AS average_rating,
      COUNT(r.rating_id) AS completed_walks
      FROM users u
      LEFT JOIN ratings r ON u.user_id=r.walker_id
      WHERE u.role='walker'
      GROUP BY u.user_id
    `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: 'failed' });
    }
});

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
