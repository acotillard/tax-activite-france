const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const db = new Database('tax_activite_france.db', { verbose: console.log });

// Exemple d'insertion de régions avec des données GeoJSON
const insertRegion = db.prepare(`
    INSERT INTO Regions (name, geojson)
    VALUES (?, ?)
`);

// Lire le fichier GeoJSON
const geojsonPath = path.join(__dirname, '../frontend/gadm41_FRA_1.json');
const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));

// Insérer les données des régions
geojsonData.features.forEach(feature => {
    const regionName = feature.properties.NAME_1;
    const regionGeoJSON = JSON.stringify(feature.geometry);
    insertRegion.run(regionName, regionGeoJSON);
});

// Exemple d'insertion d'activités économiques
const insertActivity = db.prepare(`
    INSERT INTO Activities (name, description)
    VALUES (?, ?)
`);
const activities = [
    { name: 'Tourism', description: 'Tourism activities including hotels, travel agencies, etc.' },
    { name: 'Agriculture', description: 'Agriculture activities including farming, livestock, etc.' },
    { name: 'Manufacturing', description: 'Manufacturing activities including factories, production plants, etc.' },
    { name: 'Technology', description: 'Technology activities including software development, IT services, etc.' },
    { name: 'Retail', description: 'Retail activities including shops, markets, etc.' }
];

activities.forEach(activity => {
    insertActivity.run(activity.name, activity.description);
});

// Exemple d'insertion de taxes associées à chaque activité et région
const insertTax = db.prepare(`
    INSERT INTO Taxes (name, rate, activity_id, region_id)
    VALUES (?, ?, ?, ?)
`);
const taxes = [
    { name: 'VAT for Tourism', rate: 20.0, activity_id: 1 },
    { name: 'Agriculture Tax', rate: 5.0, activity_id: 2 },
    { name: 'Manufacturing Tax', rate: 15.0, activity_id: 3 },
    { name: 'Technology Tax', rate: 25.0, activity_id: 4 },
    { name: 'Retail Tax', rate: 10.0, activity_id: 5 }
];

// Assigner les taxes à chaque région en ajoutant un préfixe au nom de la taxe
geojsonData.features.forEach((feature, regionIndex) => {
    const regionName = feature.properties.NAME_1;
    taxes.forEach(tax => {
        const taxName = `${regionName} ${tax.name}`;
        insertTax.run(taxName, tax.rate, tax.activity_id, regionIndex + 1);
    });
});

console.log('Sample data inserted successfully.');
