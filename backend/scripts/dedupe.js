// One-time cleanup: the collection was imported twice, so every restaurant exists twice.
// Keeps one document per restaurant_id and deletes the other copies.
//   node scripts/dedupe.js          -> dry run (shows counts only)
//   node scripts/dedupe.js --apply  -> actually deletes
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.collection('restaurants');
  const dups = await col.aggregate([
    { $group: { _id: '$restaurant_id', ids: { $push: '$_id' }, n: { $sum: 1 } } },
    { $match: { _id: { $ne: null }, n: { $gt: 1 } } }
  ]).toArray();
  const remove = dups.flatMap((d) => d.ids.slice(1));
  console.log(`Total documents: ${await col.countDocuments()}`);
  console.log(`Restaurants with duplicates: ${dups.length}, documents to delete: ${remove.length}`);
  if (process.argv.includes('--apply')) {
    const res = await col.deleteMany({ _id: { $in: remove } });
    console.log(`Deleted ${res.deletedCount}. Remaining: ${await col.countDocuments()}`);
  } else {
    console.log('Dry run only. Re-run with --apply to delete.');
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
