const Restaurant = require('../models/Restaurant');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pick = (b) => ({
  name: (b.name || '').trim(),
  cuisine: (b.cuisine || '').trim(),
  borough: (b.borough || '').trim(),
  building: (b.building || '').trim(),
  street: (b.street || '').trim(),
  zipcode: (b.zipcode || '').trim()
});
const validate = (f) => (!f.name || !f.cuisine || !f.borough ? 'Name, cuisine and borough are required.' : null);

// READ (list + search + filter)
exports.list = async (req, res, next) => {
  try {
    const { q, cuisine, borough } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const filter = {};
    if (q) filter.name = new RegExp(escapeRegex(q), 'i');
    // Data has trailing spaces (e.g. "American "), so match ignoring surrounding whitespace.
    if (cuisine) filter.cuisine = new RegExp('^\\s*' + escapeRegex(cuisine.trim()) + '\\s*$', 'i');
    if (borough) filter.borough = borough;
    const [data, total] = await Promise.all([
      Restaurant.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Restaurant.countDocuments(filter)
    ]);
    res.json({ data, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const doc = await Restaurant.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Restaurant not found.' });
    res.json(doc);
  } catch (e) { next(e); }
};

// CREATE
exports.create = async (req, res, next) => {
  try {
    const f = pick(req.body);
    const error = validate(f);
    if (error) return res.status(400).json({ message: error });
    const doc = await Restaurant.create({
      name: f.name, cuisine: f.cuisine, borough: f.borough,
      restaurant_id: String(Date.now()),
      address: { building: f.building, street: f.street, zipcode: f.zipcode, coord: [] },
      grades: []
    });
    res.status(201).json(doc);
  } catch (e) { next(e); }
};

// UPDATE
exports.update = async (req, res, next) => {
  try {
    const f = pick(req.body);
    const error = validate(f);
    if (error) return res.status(400).json({ message: error });
    const doc = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { $set: { name: f.name, cuisine: f.cuisine, borough: f.borough,
                'address.building': f.building, 'address.street': f.street, 'address.zipcode': f.zipcode } },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: 'Restaurant not found.' });
    res.json(doc);
  } catch (e) { next(e); }
};

// DELETE
exports.remove = async (req, res, next) => {
  try {
    const doc = await Restaurant.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Restaurant not found.' });
    res.json({ message: 'Restaurant deleted.' });
  } catch (e) { next(e); }
};

// Dropdown sources
exports.cuisines = async (req, res, next) => {
  try {
    const rows = await Restaurant.aggregate([
      { $group: { _id: { $trim: { input: '$cuisine' } } } },
      { $match: { _id: { $nin: [null, ''] } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(rows.map((r) => r._id));
  } catch (e) { next(e); }
};
exports.boroughs = async (req, res, next) => {
  try { res.json((await Restaurant.distinct('borough')).filter(Boolean).sort()); } catch (e) { next(e); }
};

// GROUP BY: restaurants per borough
exports.byBorough = async (req, res, next) => {
  try {
    const rows = await Restaurant.aggregate([
      { $group: { _id: '$borough', total: { $sum: 1 }, cuisines: { $addToSet: { $trim: { input: '$cuisine' } } } } },
      { $project: { _id: 0, borough: '$_id', total: 1, cuisineCount: { $size: '$cuisines' } } },
      { $sort: { total: -1 } }
    ]);
    res.json(rows);
  } catch (e) { next(e); }
};

// AGGREGATE: highest rated. Inspection scores are penalty points, so the lowest average score ranks first.
exports.topRated = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const match = { 'grades.0': { $exists: true } };
    if (req.query.borough) match.borough = req.query.borough;
    const rows = await Restaurant.aggregate([
      { $match: match },
      { $addFields: { avgScore: { $avg: '$grades.score' }, gradeCount: { $size: '$grades' } } },
      { $match: { gradeCount: { $gte: 3 }, avgScore: { $ne: null } } },
      { $sort: { avgScore: 1, gradeCount: -1, name: 1 } },
      { $limit: limit },
      { $project: { name: 1, cuisine: 1, borough: 1, gradeCount: 1, avgScore: { $round: ['$avgScore', 1] } } }
    ]);
    res.json(rows);
  } catch (e) { next(e); }
};

exports.overview = async (req, res, next) => {
  try {
    const [total, cuisines, boroughs] = await Promise.all([
      Restaurant.countDocuments(),
      Restaurant.aggregate([{ $group: { _id: { $trim: { input: '$cuisine' } } } }]),
      Restaurant.distinct('borough')
    ]);
    res.json({ total, cuisines: cuisines.length, boroughs: boroughs.length });
  } catch (e) { next(e); }
};
