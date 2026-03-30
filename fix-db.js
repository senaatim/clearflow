const { MongoClient } = require('mongodb');

// Using the credentials from your terminal input
const uri = "mongodb+srv://senaatim10:sharon0808@cluster0.gyks1.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

async function dropBvnIndex() {
    try {
        await client.connect();
        // Replace 'your_database_name' with your actual DB name (e.g., 'ClearFlow' or 'test')
        const database = client.db("clearflow");
        const users = database.collection("users");

        // Attempt to drop the index
        // Note: It is usually named 'bvn_hash_1' by default in MongoDB
        const result = await users.dropIndex("bvn_hash_1");
        console.log("Successfully dropped index:", result);
        
        // List remaining indexes to verify
        const indexes = await users.listIndexes().toArray();
        console.log("Current indexes:", indexes.map(i => i.name));

    } catch (err) {
        if (err.codeName === 'IndexNotFound') {
            console.log("The index 'bvn_hash_1' wasn't found. It might have a different name.");
            const current = await client.db("clearflow").collection("users").listIndexes().toArray();
            console.log("Try one of these index names instead:", current.map(i => i.name));
        } else {
            console.error("Error:", err);
        }
    } finally {
        await client.close();
    }
}

dropBvnIndex();