const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 5006; // Port for the About Us microservice

app.use(cors()); 
app.use(express.json()); // For parsing application/json bodies

// MySQL connection setup for the 'Informations' database
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

// Test database connection when the server starts
db.getConnection()
    .then(connection => {
        console.log('Connected to MySQL database: Informations');
        connection.release(); // Release the connection back to the pool
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
        process.exit(1); // Exit if database connection fails
    });

// --- API Routes for General About Us Content (Single Block) ---

// @desc    Get general about us content
// @route   GET /pre/api/aboutus
app.get('/pre/api/aboutus', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, type, content FROM about_us_content WHERE type = ?', ['general']);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching general about us content:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

// @desc    Create or update general about us content
// @route   POST /pre/api/aboutus
app.post('/pre/api/aboutus', async (req, res) => {
    const { type, content } = req.body;

    if (type !== 'general' || !content) {
        return res.status(400).json({ message: 'Only "general" content can be managed via this route, and content is required.' });
    }

    try {
        const [existingRows] = await db.query('SELECT id FROM about_us_content WHERE type = ?', [type]);

        if (existingRows.length > 0) {
            const id = existingRows[0].id;
            await db.query('UPDATE about_us_content SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [content, id]);
            res.json({ message: 'General content updated successfully' });
        } else {
            await db.query('INSERT INTO about_us_content (type, content) VALUES (?, ?)', [type, content]);
            res.status(201).json({ message: 'General content created successfully' });
        }
    } catch (error) {
        console.error('Error creating/updating general about us content:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

// @desc    Delete general about us content
// @route   DELETE /pre/api/aboutus/general
app.delete('/pre/api/aboutus/general', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM about_us_content WHERE type = ?', ['general']);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'General content not found' });
        }
        res.json({ message: 'General content deleted successfully' });
    } catch (error) {
        console.error('Error deleting general about us content:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});


// --- API Routes for Resort Facilities (Individual Items) ---

// @desc    Get all facilities
// @route   GET /pre/api/facilities
app.get('/pre/api/facilities', async (req, res) => {
    try {
        // FIX: Added image_url to the select list
        const [rows] = await db.query('SELECT id, name, description, image_url FROM facilities ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching facilities:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

// @desc    Add a new facility
// @route   POST /pre/api/facilities
app.post('/pre/api/facilities', async (req, res) => {
    // FIX: Destructure image_url
    const { name, description, image_url } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Facility name is required.' });
    }
    try {
        // FIX: Added image_url to INSERT query
        const [result] = await db.query('INSERT INTO facilities (name, description, image_url) VALUES (?, ?, ?)', [name, description || null, image_url || null]);
        res.status(201).json({ message: 'Facility added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding facility:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

// @desc    Update a facility
// @route   PUT /pre/api/facilities/:id
app.put('/pre/api/facilities/:id', async (req, res) => {
    const { id } = req.params;
    // FIX: Destructure image_url
    const { name, description, image_url } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Facility name is required for update.' });
    }
    try {
        // FIX: Added image_url to UPDATE query
        const [result] = await db.query('UPDATE facilities SET name = ?, description = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, description || null, image_url || null, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Facility not found' });
        }
        res.json({ message: 'Facility updated successfully' });
    } catch (error) {
        console.error(`Error updating facility ${id}:`, error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

// @desc    Delete a facility
// @route   DELETE /pre/api/facilities/:id
app.delete('/pre/api/facilities/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM facilities WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Facility not found' });
        }
        res.json({ message: 'Facility deleted successfully' });
    } catch (error) {
        console.error(`Error deleting facility ${id}:`, error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});


// --- API Routes for Resort Policies (Individual Items with Category) ---

// @desc    Get all policies, or policies by category
// @route   GET /pre/api/policies
// @query   category (optional) - e.g., /pre/api/policies?category=swimming_pool_rules
app.get('/pre/api/policies', async (req, res) => {
    const { category } = req.query;

    try {
        let query = 'SELECT id, policy_text, category FROM policies';
        const params = [];

        if (category) {
            query += ' WHERE category = ?';
            params.push(category);
        }
        query += ' ORDER BY created_at DESC';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching policies:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

// @desc    Add a new policy
// @route   POST /pre/api/policies
app.post('/pre/api/policies', async (req, res) => {
    const { policy_text, category } = req.body;
    if (!policy_text || !category) {
        return res.status(400).json({ message: 'Policy text and category are required.' });
    }
    try {
        const [result] = await db.query('INSERT INTO policies (policy_text, category) VALUES (?, ?)', [policy_text, category]);
        res.status(201).json({ message: 'Policy added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding policy:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

// @desc    Update a policy
// @route   PUT /pre/api/policies/:id
app.put('/pre/api/policies/:id', async (req, res) => {
    const { id } = req.params;
    const { policy_text, category } = req.body;
    if (!policy_text || !category) {
        return res.status(400).json({ message: 'Policy text and category are required for update.' });
    }
    try {
        const [result] = await db.query('UPDATE policies SET policy_text = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [policy_text, category, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Policy not found' });
        }
        res.json({ message: 'Policy updated successfully' });
    } catch (error) {
        console.error(`Error updating policy ${id}:`, error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

// @desc    Delete a policy
// @route   DELETE /pre/api/policies/:id
app.delete('/pre/api/policies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM policies WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Policy not found' });
        }
        res.json({ message: 'Policy deleted successfully' });
    } catch (error) {
        console.error(`Error deleting policy ${id}:`, error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`📘 About Us microservice running on port ${PORT}`);
});
