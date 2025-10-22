require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kursova', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected')).catch(err => console.error('MongoDB connection error:', err));

const Soldier = require('./models/soldier');
const auth = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Routes
app.use('/api/auth', authRoutes);
// admin routes (for seeding and stats) - keep protected in prod, for now open
app.use('/api/admin', adminRoutes);
app.get('/api/health', (req, res) => res.json({status: 'ok'}));

// CRUD soldiers (protected)
app.get('/api/soldiers', auth, async (req, res) => {
  try {
    const {search, specialty, unit, yearOut, yearIn} = req.query;
    const filter = {};
    if (search) filter.$or = [
      {fullName: new RegExp(search, 'i')},
      {rank: new RegExp(search, 'i')},
      {specialty: new RegExp(search, 'i')}
    ];
    if (specialty) filter.specialty = specialty;
    if (unit) filter.unit = unit;
    if (yearOut) filter.yearOut = parseInt(yearOut,10);
    if (yearIn) filter.yearIn = parseInt(yearIn,10);
    const list = await Soldier.find(filter).sort({fullName:1});
    res.json(list);
  } catch (err) { res.status(500).json({error: err.message}); }
});

app.post('/api/soldiers', auth, async (req, res) => {
  try {
    const s = new Soldier(req.body);
    await s.save();
    res.status(201).json(s);
  } catch (err) { res.status(400).json({error: err.message}); }
});

app.get('/api/soldiers/:id', auth, async (req, res) => {
  try {
    const s = await Soldier.findById(req.params.id);
    if (!s) return res.status(404).json({error: 'Not found'});
    res.json(s);
  } catch (err) { res.status(400).json({error: err.message}); }
});

app.put('/api/soldiers/:id', auth, async (req, res) => {
  try {
    const s = await Soldier.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true});
    if (!s) return res.status(404).json({error: 'Not found'});
    res.json(s);
  } catch (err) { res.status(400).json({error: err.message}); }
});

app.delete('/api/soldiers/:id', auth, async (req, res) => {
  try {
    await Soldier.findByIdAndDelete(req.params.id);
    res.json({deleted: true});
  } catch (err) { res.status(400).json({error: err.message}); }
});

// Assign to unit/position
app.post('/api/soldiers/:id/assign', auth, async (req, res) => {
  try {
    const {unit, position} = req.body;
    const s = await Soldier.findById(req.params.id);
    if (!s) return res.status(404).json({error: 'Not found'});
    s.unit = unit || s.unit;
    s.position = position || s.position;
    await s.save();
    res.json(s);
  } catch (err) { res.status(400).json({error: err.message}); }
});

// Export CSV
const stringify = require('csv-stringify').stringify;
app.get('/api/export', auth, async (req, res) => {
  try {
    const {specialty, unit, yearOut} = req.query;
    const filter = {};
    if (specialty) filter.specialty = specialty;
    if (unit) filter.unit = unit;
    if (yearOut) filter.yearOut = parseInt(yearOut,10);
    const list = await Soldier.find(filter).sort({fullName:1});
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="soldiers.csv"');

  const header = ['Full Name','Rank','Specialty','Year In','Year Out','Unit','Position'];
    const data = list.map(s => [s.fullName, s.rank, s.specialty, s.yearIn, s.yearOut, s.unit || '', s.position || '']);

    stringify([header, ...data], (err, output) => {
      if (err) return res.status(500).send(err.message);
      res.send(output);
    });
  } catch (err) { res.status(500).json({error: err.message}); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
