const mongoose = require('mongoose');

const SoldierSchema = new mongoose.Schema({
  fullName: {type: String, required: true},
  rank: {type: String, required: true},
  specialty: {type: String, required: true},
  averageGrade: {type: Number},
  yearIn: {type: Number},
  yearOut: {type: Number},
  unit: {type: String},
  unitNumber: {type: String},
  unitName: {type: String},
  position: {type: String}
}, {timestamps: true});

module.exports = mongoose.model('Soldier', SoldierSchema);
