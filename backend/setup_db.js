const Database = require('better-sqlite3');
const db = new Database('tax_activite_france.db', { verbose: console.log });

// Création de la table Regions
db.prepare(`
    CREATE TABLE IF NOT EXISTS Regions (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        geojson TEXT NOT NULL
    )
`).run();

// Création de la table Activities
db.prepare(`
    CREATE TABLE IF NOT EXISTS Activities (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT
    )
`).run();

// Création de la table Taxes
db.prepare(`
    CREATE TABLE IF NOT EXISTS Taxes (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        rate REAL NOT NULL,
        activity_id INTEGER NOT NULL,
        region_id INTEGER NOT NULL,
        FOREIGN KEY (activity_id) REFERENCES Activities(id),
        FOREIGN KEY (region_id) REFERENCES Regions(id)
    )
`).run();

console.log('Tables created successfully.');
