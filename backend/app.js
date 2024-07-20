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

// Endpoint pour récupérer toutes les activités (pour l'autocomplétion)
app.get('/activities', (req, res) => {
    const activities = db.prepare('SELECT name FROM Activities').all();
    res.json(activities);
});

// Endpoint pour ajouter une nouvelle activité à une région
app.post('/regions/:id/add-activity', (req, res) => {
    const { activity, rate } = req.body;
    const regionId = req.params.id;

    let activityId = db.prepare('SELECT id FROM Activities WHERE name = ?').get(activity)?.id;

    if (!activityId) {
        // Ajouter la nouvelle activité si elle n'existe pas
        const insertActivity = db.prepare('INSERT INTO Activities (name, description) VALUES (?, ?)');
        const info = insertActivity.run(activity, `${activity} activities description.`);
        activityId = info.lastInsertRowid;
    }

    // Ajouter la taxe associée à l'activité et à la région
    const insertTax = db.prepare('INSERT INTO Taxes (rate, activity_id, region_id) VALUES (?, ?, ?)');
    insertTax.run(rate, activityId, regionId);

    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
