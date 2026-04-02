require('dotenv').config();
const { sequelize } = require('../config/db');
const { Certificate } = require('../models');

async function syncCertificates() {
  try {
    console.log('--- Syncing Certificate table ---');
    await Certificate.sync({ alter: true });
    console.log('Successfully synced Certificates table.');
    process.exit(0);
  } catch (err) {
    console.error('Error during Certificate sync:', err);
    process.exit(1);
  }
}

syncCertificates();
