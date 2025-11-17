const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5006;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err.stack);
        process.exit(1);
    });

app.post('/pre/api/aboutus', async (req, res) => {
    const { type, content } = req.body;
    try {
        const [existing] = await db.query('SELECT id FROM aboutus_content WHERE type = ?', [type]);
        if (existing.length > 0) {
            await db.query('UPDATE aboutus_content SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [content, existing[0].id]);
            res.json({ message: 'Content updated successfully' });
        } else {
            const [result] = await db.query('INSERT INTO aboutus_content (type, content) VALUES (?, ?)', [type, content]);
            res.status(201).json({ message: 'Content added successfully', id: result.insertId });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

app.get('/pre/api/aboutus', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, type, content FROM aboutus_content WHERE type = "general"');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

app.delete('/pre/api/aboutus/general', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM aboutus_content WHERE type = "general"');
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'General content not found' });
        }
        res.json({ message: 'General content deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

app.get('/pre/api/facilities', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, description FROM facilities ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

app.post('/pre/api/facilities', async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Facility name is required.' });
    }
    try {
        const [result] = await db.query('INSERT INTO facilities (name, description) VALUES (?, ?)', [name, description || null]);
        res.status(201).json({ message: 'Facility added successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

app.put('/pre/api/facilities/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Facility name is required for update.' });
    }
    try {
        const [result] = await db.query(
            'UPDATE facilities SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, description || null, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Facility not found' });
        }
        res.json({ message: 'Facility updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

app.delete('/pre/api/facilities/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM facilities WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Facility not found' });
        }
        res.json({ message: 'Facility deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

app.post('/pre/api/policies', async (req, res) => {
    const { policy_text, category } = req.body;
    if (!policy_text || !category) {
        return res.status(400).json({ message: 'Policy text and category are required.' });
    }
    try {
        const [result] = await db.query('INSERT INTO policies (policy_text, category) VALUES (?, ?)', [policy_text, category]);
        res.status(201).json({ message: 'Policy added successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

app.get('/pre/api/policies', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, policy_text, category FROM policies ORDER BY category, created_at ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

app.put('/pre/api/policies/:id', async (req, res) => {
    const { id } = req.params;
    const { policy_text, category } = req.body;
    if (!policy_text || !category) {
        return res.status(400).json({ message: 'Policy text and category are required for update.' });
    }
    try {
        const [result] = await db.query(
            'UPDATE policies SET policy_text = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [policy_text, category, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Policy not found' });
        }
        res.json({ message: 'Policy updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

app.delete('/pre/api/policies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM policies WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Policy not found' });
        }
        res.json({ message: 'Policy deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`About Us microservice running on port ${PORT}`);
});
