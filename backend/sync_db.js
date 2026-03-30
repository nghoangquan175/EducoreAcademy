require('dotenv').config();
const { sequelize } = require('./config/db');

async function syncNewColumns() {
  try {
    console.log('--- Manually adding new columns to Chapters and Lessons ---');
    
    // Check if Chapters already has duration
    try {
      await sequelize.query("ALTER TABLE [Chapters] ADD [duration] NVARCHAR(20) NULL;");
      console.log('Added [duration] to [Chapters]');
    } catch (e) {
      console.log('[Chapters].duration error:', e.message);
    }

    try {
      await sequelize.query("ALTER TABLE [Lessons] ADD [duration] NVARCHAR(20) NULL;");
      console.log('Added [duration] to [Lessons]');
    } catch (e) {
      console.log('[Lessons].duration error:', e.message);
    }

    console.log('--- Done ---');
    process.exit(0);
  } catch (err) {
    console.error('Error during manual sync:', err);
    process.exit(1);
  }
}

syncNewColumns();
