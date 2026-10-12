const dns = require('dns');
const mongoose = require('mongoose');

// Some networks block SRV lookups on the default resolver, so use public DNS for Node.
dns.setServers(['8.8.8.8', '1.1.1.1']);

module.exports = async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing. Create backend/.env from .env.example.');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to MongoDB database "${mongoose.connection.name}"`);
};