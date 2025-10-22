const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

router.post('/register', async (req, res) => {
  try {
    const {username, password} = req.body;
    if (!username || !password) return res.status(400).json({error: 'Missing fields'});
    const existing = await User.findOne({username});
    if (existing) return res.status(400).json({error: 'User exists'});
    const hash = await bcrypt.hash(password, 10);
    const u = new User({username, passwordHash: hash});
    await u.save();
    res.status(201).json({ok:true});
  } catch (err) { res.status(500).json({error: err.message}) }
});

router.post('/login', async (req, res) => {
  try {
    const {username, password} = req.body;
    const u = await User.findOne({username});
    if (!u) return res.status(400).json({error: 'Invalid'});
    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return res.status(400).json({error:'Invalid'});
    const token = jwt.sign({id: u._id, username: u.username, role: u.role}, process.env.JWT_SECRET || 'change_this_secret', {expiresIn: '8h'});
    res.json({token});
  } catch (err) { res.status(500).json({error: err.message}) }
});

module.exports = router;
