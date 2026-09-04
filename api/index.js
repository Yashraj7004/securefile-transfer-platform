const app = require('../server/src/app');
const { connectDB } = require('../server/src/config/db');

let isDbConnected = false;

module.exports = async (req, res) => {
  if (!isDbConnected) {
    try {
      await connectDB();
      isDbConnected = true;
    } catch (err) {
      console.error('Serverless DB connection error:', err);
    }
  }
  return app(req, res);
};
