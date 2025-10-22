const express = require('express');
const router = express.Router();
const Soldier = require('../models/soldier');

// Seed random soldiers for a given yearOut
router.post('/seed/:year/:count?', async (req, res) => {
  try {
    const year = parseInt(req.params.year,10)
  const count = parseInt(req.params.count || (Math.floor(Math.random()*56)+65).toString(),10) // default 65..120
  const ranks = ['Лейтенант']
    const specs = ['Інженер','ІТ','Медик','Пілот','Розвідник','Артилерист']
    const officerPositions = ['Командир взводу','Командир роти','Начальник служби','Офіцер розвідки','Інженер-офіцер']
    const units = ['ЗСУ','ГУР','СЗРУ','ССО','ДШВ','МП','ВПС','ВМС','НГУ','СБУ','СБС','ГШ','МОУ','ДПСУ']
    const surnames = ['Іваненко','Петренко','Бондаренко','Коваленко','Шевченко','Мельник','Ткачук','Кравченко','Рибак','Гончар','Олійник','Литвин']
  const maleNames = ['Антон','Олексій','Дмитро','Володимир','Сергій','Ігор','Микола','Павло','Андрій','Юрій']
  const femaleNames = ['Олена','Наталія','Ольга','Ірина','Катерина','Марина','Тетяна','Світлана','Вікторія','Анастасія']
  const malePatr = ['Вікторович','Сергійович','Іванович','Петрович','Миколайович','Олександрович']
  const femalePatr = ['Вікторівна','Сергіївна','Іванівна','Петрівна','Миколаївна','Олександрівна']

    const docs = []
    const used = new Set()
    for (let i=0;i<count;i++){
      const avg = Math.floor(Math.random()*3)+3 // 3..5
      // compose unique full name (random gender)
      let fullName
      let attempts = 0
      do{
        const s = surnames[Math.floor(Math.random()*surnames.length)]
        const isFemale = Math.random() < 0.45 // ~45% female
        const n = isFemale ? femaleNames[Math.floor(Math.random()*femaleNames.length)] : maleNames[Math.floor(Math.random()*maleNames.length)]
        const p = isFemale ? femalePatr[Math.floor(Math.random()*femalePatr.length)] : malePatr[Math.floor(Math.random()*malePatr.length)]
        fullName = `${s} ${n} ${p}`
        attempts++
      } while(used.has(fullName) && attempts<50)
      used.add(fullName)
      const unitNum = (1000+Math.floor(Math.random()*9000)).toString()
      const doc = new Soldier({
        fullName: fullName,
        rank: 'Лейтенант',
        specialty: specs[Math.floor(Math.random()*specs.length)],
        averageGrade: avg,
        yearIn: year-4,
        yearOut: year,
        unit: '',
        unitNumber: unitNum,
        unitName: '',
        position: officerPositions[Math.floor(Math.random()*officerPositions.length)]
      })
      // assign unit based on average for realism
      if (avg===3) doc.unit = ['ЗСУ','НГУ','ДПСУ'][Math.floor(Math.random()*3)]
      if (avg===4) doc.unit = ['ДШВ','МП'][Math.floor(Math.random()*2)]
      if (avg===5) doc.unit = ['СБУ','ГУР','СЗРУ','ГШ','МОУ'][Math.floor(Math.random()*5)]
      doc.unitName = doc.unit + ' ' + (Math.floor(Math.random()*100))
      docs.push(doc)
    }
    // remove existing for this year so seed replaces
    await Soldier.deleteMany({ yearOut: year })
    await Soldier.insertMany(docs)
    res.json({inserted: docs.length})
  } catch (err){ res.status(500).json({error: err.message}) }
})

// Clear all soldiers for a given year
router.delete('/clear/:year', async (req, res) => {
  try{
    const year = parseInt(req.params.year,10)
    const result = await Soldier.deleteMany({ yearOut: year })
    res.json({deleted: result.deletedCount})
  }catch(err){ res.status(500).json({error: err.message}) }
})

// Clear all soldiers (global)
router.delete('/clearAll', async (req, res) => {
  try{
    const result = await Soldier.deleteMany({})
    res.json({deleted: result.deletedCount})
  }catch(err){ res.status(500).json({error: err.message}) }
})

// Stats: count per unit for a given yearOut
router.get('/stats/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year,10)
    const agg = await Soldier.aggregate([
      { $match: { yearOut: year } },
      { $group: { _id: '$unit', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    const total = agg.reduce((s, a) => s + a.count, 0)
    res.json({total, breakdown: agg})
  } catch (err){ res.status(500).json({error: err.message}) }
})

module.exports = router;
