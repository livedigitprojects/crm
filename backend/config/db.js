const mongoose = require('mongoose');

const cache = global._mongooseCache || (global._mongooseCache = { conn: null, promise: null });

const connectDB = async () => {
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aetheria-crm', {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 30000
      })
      .then((m) => {
        console.log(`MongoDB Connected: ${m.connection.host}`);
        return m;
      })
      .catch((err) => {
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
};

module.exports = connectDB;