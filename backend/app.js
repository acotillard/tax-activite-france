const express = require('express');
const Database = require('better-sqlite3');
const app = express();
const db = new Database('tax_activite_france.db', { verbose: console.log });

app.use(express.json());
app.use(express.static('../frontend'));  // Assurez-vous que le frontend est servi statiquement

// Endpoint pour obtenir les régions avec leurs GeoJSON
app.get('/regions', (req, res) => {
    const regions = db.prepare('SELECT * FROM Regions').all();
    res.json(regions);
});

// Endpoint pour obtenir les informations d'une région spécifique
app.get('/regions/:id', (req, res) => {
    const region = db.prepare('SELECT * FROM Regions WHERE id = ?').get(req.params.id);
    if (region) {
        res.json(region);
    } else {
        res.status(404).send('Region not found');
    }
});

// Endpoint pour obtenir les activités et taxes d'une région spécifique
app.get('/regions/:id/details', (req, res) => {
    const details = db.prepare(`
        SELECT a.name AS activity, t.rate
        FROM Activities a
        JOIN Taxes t ON a.id = t.activity_id
        WHERE t.region_id = ?
    `).all(req.params.id);
    res.json(details);
});

// Endpoint pour mettre à jour les activités et taxes d'une région spécifique
app.post('/regions/:id/update', (req, res) => {
    const { updates } = req.body;
    const regionId = req.params.id;

    const updateTax = db.prepare(`
        UPDATE Taxes SET rate = ?
        WHERE region_id = ? AND activity_id = (SELECT id FROM Activities WHERE name = ?)
    `);

    updates.forEach(update => {
        updateTax.run(update.rate, regionId, update.activity);
    });

    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
