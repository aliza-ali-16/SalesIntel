const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isConnected = false;
let useJsonFallback = false;
const JSON_DB_DIR = path.join(__dirname, '..', '..', 'data', 'db_store');

// Ensure database fallback directory exists
if (!fs.existsSync(JSON_DB_DIR)) {
  fs.mkdirSync(JSON_DB_DIR, { recursive: true });
}

const connectDB = async () => {
  if (process.env.USE_EMBEDDED_AGENTS === 'only_json') {
    console.log('⚠️ Running in JSON-only database mode by explicit configuration.');
    useJsonFallback = true;
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    // Connect with a 2.5 second timeout to quickly fallback if not running
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sales_intelligence', {
      serverSelectionTimeoutMS: 2500,
    });
    isConnected = true;
    console.log('🚀 Connected to MongoDB successfully.');
  } catch (err) {
    console.warn(`⚠️ MongoDB Connection Failed: ${err.message}`);
    console.log('🔄 Falling back to local JSON File Data Store.');
    useJsonFallback = true;
  }
};

const dbCache = {};

// Deduplicate helper
const cleanAndDeduplicate = (modelName, items) => {
  if (!Array.isArray(items)) return [];
  
  if (modelName === 'Customer') {
    const seen = new Set();
    const clean = [];
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item && item.email) {
        const emailKey = item.email.toLowerCase().trim();
        if (!seen.has(emailKey)) {
          seen.add(emailKey);
          clean.unshift(item);
        }
      }
    }
    return clean;
  }
  
  if (modelName === 'Email') {
    const seen = new Set();
    const clean = [];
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item && item.customerId) {
        const key = item.customerId.toString();
        if (!seen.has(key)) {
          seen.add(key);
          clean.unshift(item);
        }
      }
    }
    return clean;
  }

  if (modelName === 'FollowUp') {
    const seen = new Set();
    const clean = [];
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item && item.customerId) {
        const key = item.customerId.toString();
        if (!seen.has(key)) {
          seen.add(key);
          clean.unshift(item);
        }
      }
    }
    return clean;
  }

  if (modelName === 'VectorMemory') {
    const seen = new Set();
    const clean = [];
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item && item.id && item.text) {
        const key = `${item.id.toLowerCase().trim()}_${item.text.trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          clean.unshift(item);
        }
      }
    }
    return clean;
  }

  if (modelName === 'AgentLog') {
    if (items.length > 200) {
      return items.slice(items.length - 200);
    }
  }

  return items;
};

// Helper for JSON DB file operations
const readJsonFile = (modelName) => {
  if (dbCache[modelName]) {
    return dbCache[modelName];
  }
  const filePath = path.join(JSON_DB_DIR, `${modelName}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    dbCache[modelName] = [];
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(data || '[]');
    const cleaned = cleanAndDeduplicate(modelName, parsed);
    dbCache[modelName] = cleaned;
    return cleaned;
  } catch (e) {
    console.error(`Error reading ${modelName} JSON db file:`, e);
    return [];
  }
};

const writeJsonFile = (modelName, data) => {
  const cleaned = cleanAndDeduplicate(modelName, data);
  dbCache[modelName] = cleaned;
  const filePath = path.join(JSON_DB_DIR, `${modelName}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2));
  } catch (e) {
    console.error(`Error writing ${modelName} JSON db file:`, e);
  }
};

// Query matcher for JSON database
const matchesQuery = (item, query) => {
  if (!query) return true;
  for (const key in query) {
    const queryVal = query[key];
    if (queryVal && typeof queryVal === 'object') {
      // Check if it's a MongoDB ObjectID (which has a toString() method we should use)
      if (queryVal.constructor && queryVal.constructor.name === 'ObjectId') {
        const itemVal = item[key] ? item[key].toString() : '';
        if (itemVal !== queryVal.toString()) {
          return false;
        }
      } else if ('$ne' in queryVal) {
        if (item[key] === queryVal['$ne']) return false;
      } else if ('$in' in queryVal) {
        if (!Array.isArray(queryVal['$in']) || !queryVal['$in'].includes(item[key])) return false;
      } else {
        // Fallback: compare string representations of object
        const itemVal = item[key] ? item[key].toString() : '';
        if (itemVal !== queryVal.toString()) {
          return false;
        }
      }
    } else {
      const itemVal = (item[key] !== undefined && item[key] !== null) ? item[key].toString() : '';
      const valStr = (queryVal !== undefined && queryVal !== null) ? queryVal.toString() : '';
      if (itemVal !== valStr) {
        return false;
      }
    }
  }
  return true;
};

// Custom JSON Model Wrapper
class JsonModel {
  constructor(name) {
    this.name = name;
  }

  async find(query = {}) {
    const items = readJsonFile(this.name);
    return items.filter(item => matchesQuery(item, query));
  }

  async findOne(query = {}) {
    const items = readJsonFile(this.name);
    return items.find(item => matchesQuery(item, query)) || null;
  }

  async findById(id) {
    const items = readJsonFile(this.name);
    return items.find(item => item._id === id || item._id === id.toString()) || null;
  }

  async create(data) {
    const items = readJsonFile(this.name);
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newDoc);
    writeJsonFile(this.name, items);
    return newDoc;
  }

  async findOneAndUpdate(query, update, options = { new: true, upsert: false }) {
    const items = readJsonFile(this.name);
    let index = items.findIndex(item => matchesQuery(item, query));
    
    if (index === -1) {
      if (options.upsert) {
        const updateFields = update.$set || {};
        const otherUpdates = { ...update };
        delete otherUpdates.$set;
        return this.create({ ...query, ...otherUpdates, ...updateFields });
      }
      return null;
    }

    const updateFields = update.$set || {};
    const otherUpdates = { ...update };
    delete otherUpdates.$set;
    items[index] = {
      ...items[index],
      ...otherUpdates,
      ...updateFields,
      updatedAt: new Date().toISOString()
    };
    writeJsonFile(this.name, items);
    return items[index];
  }

  async updateOne(query, update) {
    const items = readJsonFile(this.name);
    const index = items.findIndex(item => matchesQuery(item, query));
    if (index === -1) return { nModified: 0, matchedCount: 0 };
    
    const updateFields = update.$set || {};
    const otherUpdates = { ...update };
    delete otherUpdates.$set;
    items[index] = {
      ...items[index],
      ...otherUpdates,
      ...updateFields,
      updatedAt: new Date().toISOString()
    };
    writeJsonFile(this.name, items);
    return { nModified: 1, matchedCount: 1 };
  }

  async deleteMany(query = {}) {
    const items = readJsonFile(this.name);
    const keep = items.filter(item => !matchesQuery(item, query));
    const deletedCount = items.length - keep.length;
    writeJsonFile(this.name, keep);
    return { deletedCount };
  }

  async countDocuments(query = {}) {
    const items = readJsonFile(this.name);
    return items.filter(item => matchesQuery(item, query)).length;
  }
}

// Unified model generator
const createModel = (modelName, mongooseSchema) => {
  const MongooseModel = mongoose.model(modelName, mongooseSchema);
  const jsonModelInstance = new JsonModel(modelName);

  return {
    find: async (query) => {
      if (useJsonFallback) return await jsonModelInstance.find(query);
      return await MongooseModel.find(query);
    },
    findOne: async (query) => {
      if (useJsonFallback) return await jsonModelInstance.findOne(query);
      return await MongooseModel.findOne(query);
    },
    findById: async (id) => {
      if (useJsonFallback) return await jsonModelInstance.findById(id);
      return await MongooseModel.findById(id);
    },
    create: async (data) => {
      if (useJsonFallback) return await jsonModelInstance.create(data);
      return await MongooseModel.create(data);
    },
    findOneAndUpdate: async (query, update, options) => {
      if (useJsonFallback) return await jsonModelInstance.findOneAndUpdate(query, update, options);
      return await MongooseModel.findOneAndUpdate(query, update, options);
    },
    updateOne: async (query, update) => {
      if (useJsonFallback) return await jsonModelInstance.updateOne(query, update);
      return await MongooseModel.updateOne(query, update);
    },
    deleteMany: async (query) => {
      if (useJsonFallback) return await jsonModelInstance.deleteMany(query);
      return await MongooseModel.deleteMany(query);
    },
    countDocuments: async (query) => {
      if (useJsonFallback) return await jsonModelInstance.countDocuments(query);
      return await MongooseModel.countDocuments(query);
    },
    // Expose underlying implementations for raw operations if needed
    isFallback: () => useJsonFallback,
    getRawModel: () => useJsonFallback ? jsonModelInstance : MongooseModel
  };
};

module.exports = {
  connectDB,
  createModel,
  isFallback: () => useJsonFallback
};
