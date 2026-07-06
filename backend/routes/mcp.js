const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Store MCP contexts in a separate JSON file/database
const MCP_STORE_FILE = path.join(__dirname, '..', '..', 'data', 'db_store', 'McpMemory.json');

// Ensure parent folder exists
if (!fs.existsSync(path.dirname(MCP_STORE_FILE))) {
  fs.mkdirSync(path.dirname(MCP_STORE_FILE), { recursive: true });
}

// Read helper
const readMcpStore = () => {
  if (!fs.existsSync(MCP_STORE_FILE)) {
    fs.writeFileSync(MCP_STORE_FILE, JSON.stringify({}, null, 2));
    return {};
  }
  try {
    const content = fs.readFileSync(MCP_STORE_FILE, 'utf8');
    return JSON.parse(content || '{}');
  } catch (err) {
    console.error('Error reading MCP Store:', err);
    return {};
  }
};

// Write helper
const writeMcpStore = (data) => {
  try {
    fs.writeFileSync(MCP_STORE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing MCP Store:', err);
  }
};

// @route   POST /api/mcp/store
// @desc    Store agent context memory
// @access  Private
router.post('/store', auth, (req, res) => {
  const { id, type, data } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Memory Key "id" is required.' });
  }

  try {
    const store = readMcpStore();
    store[id] = {
      type: type || 'generic',
      data: data || {},
      timestamp: new Date().toISOString()
    };
    
    writeMcpStore(store);

    res.json({
      message: `MCP context context stored for ID: ${id}`,
      stored: store[id]
    });
  } catch (err) {
    res.status(500).json({ message: 'MCP Store error', error: err.message });
  }
});

// @route   GET /api/mcp/context/:id
// @desc    Retrieve agent context memory
// @access  Private
router.get('/context/:id', auth, (req, res) => {
  const { id } = req.params;

  try {
    const store = readMcpStore();
    const context = store[id];

    if (!context) {
      return res.status(404).json({ message: `MCP Context not found for ID: ${id}` });
    }

    res.json(context);
  } catch (err) {
    res.status(500).json({ message: 'MCP Retrieve error', error: err.message });
  }
});

module.exports = router;
