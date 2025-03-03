const express = require('express');
const router = express.Router();
const Memory = require('../models/memoryModel');

// POST /create-memory
router.post('/create-memory', async (req, res) => {
    try {
        const { email, ...memoryData } = req.body;
        if (!email) {
            return res.status(400).send({ error: 'Email is required.' });
        }
        const memory = new Memory({ email, ...memoryData });
        await memory.save();
        res.status(201).send(memory);
    } catch (error) {
        res.status(400).send(error);
    }
});

// PATCH /update-memory
router.patch('/update-memory', async (req, res) => {
    try {
        const { email, key, ...updates } = req.body;
        if (!email) {
            return res.status(400).send({ error: 'Email is required.' });
        }
        const memory = await Memory.findOneAndUpdate({ email, key }, updates, { new: true });
        if (!memory) {
            return res.status(404).send();
        }
        res.send(memory);
    } catch (error) {
        res.status(400).send(error);
    }
});

// GET /all-keys
router.get('/all-keys', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).send({ error: 'Email is required.' });
        }
        const keys = await Memory.find({ email }).distinct('key');
        res.send(keys);
    } catch (error) {
        res.status(500).send(error);
    }
});

// GET /remember-by-key
router.get('/remember-by-key', async (req, res) => {
    try {
        const { email, key } = req.query;
        if (!email) {
            return res.status(400).send({ error: 'Email is required.' });
        }
        const memory = await Memory.findOne({ email, key });
        if (!memory) {
            return res.status(404).send();
        }
        res.send(memory);
    } catch (error) {
        res.status(500).send(error);
    }
});

// GET /remember-by-tag
router.get('/remember-by-tag', async (req, res) => {
    try {
        const { email, tag } = req.query;
        if (!email) {
            return res.status(400).send({ error: 'Email is required.' });
        }
        const memories = await Memory.find({ email, tags: tag });
        res.send(memories);
    } catch (error) {
        res.status(500).send(error);
    }
});

// GET /all-tags
router.get('/all-tags', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).send({ error: 'Email is required.' });
        }
        const tags = await Memory.find({ email }).distinct('tags');
        res.send(tags);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;

