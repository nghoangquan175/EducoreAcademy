require('dotenv').config();
const { sequelize } = require('./config/db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected');

    const queries = [
      `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Courses') AND name = 'level')
       ALTER TABLE [Courses] ADD [level] NVARCHAR(50) DEFAULT 'Beginner' NOT NULL`,
      `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Courses') AND name = 'rating')
       ALTER TABLE [Courses] ADD [rating] FLOAT DEFAULT 0 NOT NULL`,
      `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Courses') AND name = 'studentsCount')
       ALTER TABLE [Courses] ADD [studentsCount] INTEGER DEFAULT 0 NOT NULL`,
      `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Courses') AND name = 'duration')
       ALTER TABLE [Courses] ADD [duration] NVARCHAR(50) NULL`,
    ];

    for (const q of queries) {
      await sequelize.query(q);
      console.log('OK:', q.substring(0, 60));
    }
    console.log('All columns added!');
  } catch (e) {
    console.error('ERROR:', e.message);
    if (e.original) console.error('ORIGINAL:', e.original.message);
  } finally {
    process.exit(0);
  }
})();
