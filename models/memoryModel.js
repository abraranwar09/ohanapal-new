const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    memory: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    tags: [{ type: String }],
    email: { type: String, required: true },
});

const Memory = mongoose.model('Memory', memorySchema);

module.exports = Memory; 