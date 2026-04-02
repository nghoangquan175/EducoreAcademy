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

    // New Comment columns
    const commentCols = [
      { name: 'moderationSource', type: 'NVARCHAR(100)' },
      { name: 'moderationReason', type: 'NVARCHAR(500)' },
      { name: 'likeCount', type: 'INT DEFAULT 0' },
      { name: 'heartCount', type: 'INT DEFAULT 0' },
      { name: 'helpfulCount', type: 'INT DEFAULT 0' }
    ];

    for (const col of commentCols) {
      try {
        await sequelize.query(`ALTER TABLE [Comments] ADD [${col.name}] ${col.type};`);
        console.log(`Added [${col.name}] to [Comments]`);
      } catch (e) {
        console.log(`[Comments].${col.name} error:`, e.message);
      }
    }

    // New User columns
    try {
      await sequelize.query("ALTER TABLE [Users] ADD [reputationScore] INT DEFAULT 100;");
      console.log('Added [reputationScore] to [Users]');
    } catch (e) {
      console.log('[Users].reputationScore error:', e.message);
    }

    try {
      await sequelize.query("ALTER TABLE [Users] ADD [mutedUntil] DATETIME2 NULL;");
      console.log('Added [mutedUntil] to [Users] (as DATETIME2)');
    } catch (e) {
      // If already exists, try to alter type to DATETIME2 for better compatibility
      try {
        await sequelize.query("ALTER TABLE [Users] ALTER COLUMN [mutedUntil] DATETIME2;");
        console.log('Altered [mutedUntil] to DATETIME2');
      } catch (alterE) {
        console.log('[Users].mutedUntil error:', e.message);
      }
    }

    // Sync the whole thing to create new tables like CommentReaction
    console.log('--- Final sync to create new tables ---');
    await sequelize.sync({ force: false });
    console.log('Database synced');

    console.log('--- Done ---');
    process.exit(0);
  } catch (err) {
    console.error('Error during manual sync:', err);
    process.exit(1);
  }
}

syncNewColumns();
