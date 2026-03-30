const { MongoClient } = require('mongodb');

const targets = [
    { label: "Local", uri: "mongodb://localhost:27017" },
    { label: "Atlas", uri: "mongodb+srv://senaatim10:sharon0808@cluster0.gyks1.mongodb.net/?appName=Cluster0" },
];

async function fixDatabase(label, uri) {
    const client = new MongoClient(uri);
    console.log(`\n========== ${label} ==========`);
    try {
        await client.connect();
        console.log("Connected.");

        const { databases } = await client.db().admin().listDatabases();

        for (const { name } of databases) {
            if (['admin', 'local', 'config'].includes(name)) continue;

            const db = client.db(name);
            const hasCols = await db.listCollections({ name: 'users' }).toArray();
            if (!hasCols.length) continue;

            console.log(`\nDatabase: "${name}" — found users collection`);
            const users = db.collection('users');

            // 1. List all indexes
            const indexes = await users.listIndexes().toArray();
            console.log("Indexes:", indexes.map(i => i.name).join(', '));

            // 2. Drop bvn_hash index if it exists
            const bvnIndex = indexes.find(i => i.key && i.key.bvn_hash !== undefined);
            if (bvnIndex) {
                await users.dropIndex(bvnIndex.name);
                console.log(`✓ Dropped index: "${bvnIndex.name}"`);
            } else {
                console.log("No bvn_hash index found.");
            }

            // 3. Remove bvn_hash field from all documents
            const result = await users.updateMany(
                { bvn_hash: { $exists: true } },
                { $unset: { bvn_hash: "" } }
            );
            console.log(`✓ Removed bvn_hash field from ${result.modifiedCount} document(s)`);

            // 4. Confirm remaining indexes
            const remaining = await users.listIndexes().toArray();
            console.log("Remaining indexes:", remaining.map(i => i.name).join(', '));
        }

    } catch (err) {
        console.log(`✗ ${label} failed: ${err.message}`);
    } finally {
        await client.close();
    }
}

(async () => {
    for (const { label, uri } of targets) {
        await fixDatabase(label, uri);
    }
    console.log("\n✓ Done.");
})();
