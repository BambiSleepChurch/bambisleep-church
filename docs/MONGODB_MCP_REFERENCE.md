# MongoDB MCP Server Reference

> Quick reference for building the MongoDB MCP server integration.

## Overview

MongoDB is a document-oriented NoSQL database. The official Node.js driver allows applications to connect and perform CRUD operations using Promises or callbacks.

**Supported Connections:**

- Local MongoDB instances
- MongoDB Atlas (cloud-hosted clusters)
- Replica sets

## Configuration

### Environment Variables

```bash
# MongoDB Atlas (recommended for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bambisleepchurch?retryWrites=true&w=majority

# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/bambisleep

# Optional: Override default database
MONGODB_DATABASE=bambisleep
```

### Connection Options (Atlas-optimized)

The wrapper automatically applies optimized settings for Atlas connections:

| Option                     | Value      | Description                    |
| -------------------------- | ---------- | ------------------------------ |
| `maxPoolSize`              | `10`       | Max connection pool size       |
| `minPoolSize`              | `2`        | Min connections to maintain    |
| `connectTimeoutMS`         | `10000`    | Connection timeout (10s)       |
| `socketTimeoutMS`          | `45000`    | Socket timeout (45s)           |
| `serverSelectionTimeoutMS` | `10000`    | Server selection timeout (10s) |
| `retryWrites`              | `true`     | Enable retryable writes        |
| `retryReads`               | `true`     | Enable retryable reads         |
| `w`                        | `majority` | Write concern for data safety  |

## Connection

### Connection String Format

```
mongodb://[username:password@]host[:port][/defaultauthdb][?options]
mongodb+srv://[username:password@]host[/defaultauthdb][?options]
```

**Components:**

| Component            | Description                           |
| -------------------- | ------------------------------------- |
| `mongodb://`         | Standard connection prefix            |
| `mongodb+srv://`     | SRV connection format (Atlas)         |
| `username:password@` | Optional authentication credentials   |
| `host[:port]`        | Server hostname, default port `27017` |
| `/defaultauthdb`     | Default database (defaults to `test`) |
| `?options`           | Connection options as query params    |

### Connection Examples

```javascript
// Local standalone
mongodb://localhost:27017

// With authentication
mongodb://myUser:myPassword@localhost:27017/myDatabase

// With auth source
mongodb://myUser:myPassword@localhost:27017/myDatabase?authSource=admin

// MongoDB Atlas (SRV)
mongodb+srv://myUser:myPassword@cluster0.example.mongodb.net/myDatabase

// Replica set
mongodb://host1:27017,host2:27017,host3:27017/myDatabase?replicaSet=myReplicaSet
```

### Common Connection Options

| Option             | Description              | Default |
| ------------------ | ------------------------ | ------- |
| `authSource`       | Authentication database  | `admin` |
| `replicaSet`       | Replica set name         | -       |
| `ssl` / `tls`      | Enable TLS/SSL           | `false` |
| `retryWrites`      | Enable retryable writes  | `true`  |
| `w`                | Write concern            | `1`     |
| `maxPoolSize`      | Max connection pool size | `100`   |
| `connectTimeoutMS` | Connection timeout       | `10000` |

## Node.js Driver Setup

### Installation

```bash
npm install mongodb
```

### Basic Connection

```javascript
const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function connect() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("myDatabase");
    const collection = db.collection("myCollection");

    // Perform operations...
  } finally {
    await client.close();
  }
}

connect();
```

## CRUD Operations

### Create (Insert)

```javascript
// Insert one document
const result = await collection.insertOne({
  name: "Alice",
  email: "alice@example.com",
  age: 25,
});
console.log(`Inserted ID: ${result.insertedId}`);

// Insert multiple documents
const results = await collection.insertMany([
  { name: "Bob", email: "bob@example.com", age: 30 },
  { name: "Carol", email: "carol@example.com", age: 28 },
]);
console.log(`Inserted ${results.insertedCount} documents`);
```

### Read (Find)

```javascript
// Find one document
const doc = await collection.findOne({ name: "Alice" });

// Find multiple documents
const cursor = collection.find({ age: { $gte: 25 } });
const docs = await cursor.toArray();

// Find with projection (select fields)
const doc = await collection.findOne(
  { name: "Alice" },
  { projection: { name: 1, email: 1, _id: 0 } }
);

// Find with sort and limit
const docs = await collection.find({}).sort({ age: -1 }).limit(10).toArray();

// Count documents
const count = await collection.countDocuments({ age: { $gte: 25 } });
```

### Update

```javascript
// Update one document
const result = await collection.updateOne(
  { name: "Alice" }, // filter
  { $set: { age: 26 } } // update
);
console.log(`Modified ${result.modifiedCount} document(s)`);

// Update multiple documents
const result = await collection.updateMany(
  { age: { $lt: 30 } },
  { $inc: { age: 1 } }
);

// Replace entire document
const result = await collection.replaceOne(
  { name: "Alice" },
  { name: "Alice", email: "newalice@example.com", age: 27 }
);

// Find and update (returns original or updated doc)
const doc = await collection.findOneAndUpdate(
  { name: "Alice" },
  { $set: { status: "active" } },
  { returnDocument: "after" } // 'before' or 'after'
);
```

### Delete

```javascript
// Delete one document
const result = await collection.deleteOne({ name: "Alice" });
console.log(`Deleted ${result.deletedCount} document(s)`);

// Delete multiple documents
const result = await collection.deleteMany({ age: { $lt: 25 } });

// Find and delete (returns deleted doc)
const doc = await collection.findOneAndDelete({ name: "Alice" });
```

## Query Operators

### Comparison

| Operator | Description           | Example                            |
| -------- | --------------------- | ---------------------------------- |
| `$eq`    | Equal                 | `{ age: { $eq: 25 } }`             |
| `$ne`    | Not equal             | `{ age: { $ne: 25 } }`             |
| `$gt`    | Greater than          | `{ age: { $gt: 25 } }`             |
| `$gte`   | Greater than or equal | `{ age: { $gte: 25 } }`            |
| `$lt`    | Less than             | `{ age: { $lt: 25 } }`             |
| `$lte`   | Less than or equal    | `{ age: { $lte: 25 } }`            |
| `$in`    | In array              | `{ status: { $in: ['A', 'B'] } }`  |
| `$nin`   | Not in array          | `{ status: { $nin: ['A', 'B'] } }` |

### Logical

| Operator | Description | Example                                    |
| -------- | ----------- | ------------------------------------------ |
| `$and`   | Logical AND | `{ $and: [{ age: 25 }, { status: 'A' }] }` |
| `$or`    | Logical OR  | `{ $or: [{ age: 25 }, { status: 'A' }] }`  |
| `$not`   | Logical NOT | `{ age: { $not: { $gt: 25 } } }`           |
| `$nor`   | Logical NOR | `{ $nor: [{ age: 25 }, { status: 'A' }] }` |

### Element

| Operator  | Description   | Example                        |
| --------- | ------------- | ------------------------------ |
| `$exists` | Field exists  | `{ email: { $exists: true } }` |
| `$type`   | Field is type | `{ age: { $type: 'number' } }` |

### Array

| Operator     | Description     | Example                                   |
| ------------ | --------------- | ----------------------------------------- |
| `$all`       | Contains all    | `{ tags: { $all: ['a', 'b'] } }`          |
| `$elemMatch` | Element matches | `{ scores: { $elemMatch: { $gt: 80 } } }` |
| `$size`      | Array size      | `{ tags: { $size: 3 } }`                  |

## Update Operators

| Operator    | Description         | Example                          |
| ----------- | ------------------- | -------------------------------- |
| `$set`      | Set field value     | `{ $set: { name: 'New' } }`      |
| `$unset`    | Remove field        | `{ $unset: { temp: '' } }`       |
| `$inc`      | Increment value     | `{ $inc: { age: 1 } }`           |
| `$mul`      | Multiply value      | `{ $mul: { price: 1.1 } }`       |
| `$min`      | Update if less      | `{ $min: { low: 5 } }`           |
| `$max`      | Update if greater   | `{ $max: { high: 100 } }`        |
| `$push`     | Add to array        | `{ $push: { tags: 'new' } }`     |
| `$pull`     | Remove from array   | `{ $pull: { tags: 'old' } }`     |
| `$addToSet` | Add unique to array | `{ $addToSet: { tags: 'new' } }` |
| `$rename`   | Rename field        | `{ $rename: { old: 'new' } }`    |

## Aggregation Pipeline

```javascript
const results = await collection
  .aggregate([
    // Stage 1: Filter
    { $match: { status: "active" } },

    // Stage 2: Group
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
        avgAmount: { $avg: "$amount" },
      },
    },

    // Stage 3: Sort
    { $sort: { total: -1 } },

    // Stage 4: Limit
    { $limit: 10 },

    // Stage 5: Project
    {
      $project: {
        category: "$_id",
        total: 1,
        count: 1,
        _id: 0,
      },
    },
  ])
  .toArray();
```

### Common Aggregation Stages

| Stage        | Description        |
| ------------ | ------------------ |
| `$match`     | Filter documents   |
| `$group`     | Group by field(s)  |
| `$sort`      | Sort results       |
| `$limit`     | Limit results      |
| `$skip`      | Skip results       |
| `$project`   | Reshape documents  |
| `$lookup`    | Join collections   |
| `$unwind`    | Deconstruct arrays |
| `$count`     | Count documents    |
| `$addFields` | Add new fields     |

## Indexes

```javascript
// Create single field index
await collection.createIndex({ email: 1 });

// Create compound index
await collection.createIndex({ lastName: 1, firstName: 1 });

// Create unique index
await collection.createIndex({ email: 1 }, { unique: true });

// Create text index
await collection.createIndex({ description: "text" });

// List indexes
const indexes = await collection.indexes();

// Drop index
await collection.dropIndex("email_1");
```

## Database & Collection Management

```javascript
// List databases
const dbs = await client.db().admin().listDatabases();

// List collections
const collections = await db.listCollections().toArray();

// Create collection
await db.createCollection("newCollection");

// Drop collection
await collection.drop();

// Drop database
await db.dropDatabase();

// Get collection stats
const stats = await db.command({ collStats: "myCollection" });
```

## MCP Server Implementation Notes

### Recommended Tools

| Tool Name          | MongoDB Method                | Description                  |
| ------------------ | ----------------------------- | ---------------------------- |
| `connect`          | `client.connect()`            | Connect to MongoDB           |
| `disconnect`       | `client.close()`              | Close connection             |
| `list_databases`   | `admin.listDatabases()`       | List all databases           |
| `list_collections` | `db.listCollections()`        | List collections in database |
| `find_one`         | `collection.findOne()`        | Find single document         |
| `find_many`        | `collection.find()`           | Find multiple documents      |
| `insert_one`       | `collection.insertOne()`      | Insert single document       |
| `insert_many`      | `collection.insertMany()`     | Insert multiple documents    |
| `update_one`       | `collection.updateOne()`      | Update single document       |
| `update_many`      | `collection.updateMany()`     | Update multiple documents    |
| `delete_one`       | `collection.deleteOne()`      | Delete single document       |
| `delete_many`      | `collection.deleteMany()`     | Delete multiple documents    |
| `aggregate`        | `collection.aggregate()`      | Run aggregation pipeline     |
| `count_documents`  | `collection.countDocuments()` | Count matching documents     |
| `create_index`     | `collection.createIndex()`    | Create an index              |
| `drop_index`       | `collection.dropIndex()`      | Drop an index                |

### Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017     # Connection string
MONGODB_DATABASE=myDatabase               # Default database
MONGODB_USER=myUser                       # Username (optional)
MONGODB_PASSWORD=myPassword               # Password (optional)
```

### Docker (Local Development)

```bash
# Run MongoDB container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -v mongodb_data:/data/db \
  mongo:7

# Connection string for containerized MongoDB
mongodb://root:password@localhost:27017/?authSource=admin
```

### Error Handling

```javascript
try {
  await collection.insertOne(doc);
} catch (error) {
  if (error.code === 11000) {
    // Duplicate key error
    console.error("Document already exists");
  } else if (error.name === "MongoNetworkError") {
    // Connection error
    console.error("Cannot connect to MongoDB");
  } else {
    throw error;
  }
}
```

### Common Error Codes

| Code    | Description                 |
| ------- | --------------------------- |
| `11000` | Duplicate key error         |
| `121`   | Document validation failure |
| `13`    | Unauthorized                |
| `18`    | Authentication failed       |
| `50`    | Max time exceeded           |

## MongoDB Atlas (Cloud)

For production, consider using [MongoDB Atlas](https://www.mongodb.com/atlas):

1. Create cluster at `cloud.mongodb.com`
2. Whitelist IP addresses
3. Create database user
4. Get connection string (SRV format)

```javascript
const uri =
  "mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/myDatabase?retryWrites=true&w=majority";
```

---

_Reference: [MongoDB Node.js Driver](https://mongodb.github.io/node-mongodb-native/) | [MongoDB Manual](https://www.mongodb.com/docs/manual/)_
