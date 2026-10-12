const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    cuisine: { type: String, required: true, trim: true },
    borough: { type: String, required: true, trim: true },
    restaurant_id: String,
    address: {
      building: String,
      street: String,
      zipcode: String,
      coord: [Number]
    },
    grades: [{ date: Date, grade: String, score: Number }]
  },
  { collection: 'restaurants', versionKey: false }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
