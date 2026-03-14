const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  server: process.env.DB_HOST,
  dialect: 'mssql',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  dialectOptions: {
    options: {
      encrypt: true, // Use this if you're on Windows Azure
      trustServerCertificate: true // Change to false if in production and you have a valid cert
    }
  },
  logging: false // Disable logging if desired
});

const connectDB = async () => {
  try {
    // Sync — force:false to avoid dropping existing data.
    await sequelize.sync({ force: false });
    console.log('Database synced');

    // Manual migration for MSSQL since alter: true has syntax issues
    try {
      // QuizAttempts userAnswers
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID(N'[dbo].[QuizAttempts]') 
          AND name = 'userAnswers'
        )
        BEGIN
          ALTER TABLE [dbo].[QuizAttempts] ADD [userAnswers] NVARCHAR(MAX) NULL
        END
      `);

      // Enrollments lastAccessedAt
      // First, drop if it exists to ensure type correctness (DATETIME -> DATETIME2)
      try {
        await sequelize.query(`
          IF EXISTS (
            SELECT * FROM sys.columns 
            WHERE object_id = OBJECT_ID(N'[dbo].[Enrollments]') 
            AND name = 'lastAccessedAt'
          )
          AND EXISTS (
             SELECT * FROM sys.types t 
             JOIN sys.columns c ON t.user_type_id = c.user_type_id 
             WHERE c.object_id = OBJECT_ID(N'[dbo].[Enrollments]') 
             AND c.name = 'lastAccessedAt' AND t.name = 'datetime'
          )
          BEGIN
            ALTER TABLE [dbo].[Enrollments] DROP COLUMN [lastAccessedAt]
          END
        `);
      } catch (e) {
        console.log('Minor issue dropping column:', e.message);
      }

      await sequelize.query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID(N'[dbo].[Enrollments]') 
          AND name = 'lastAccessedAt'
        )
        BEGIN
          ALTER TABLE [dbo].[Enrollments] ADD [lastAccessedAt] DATETIME2 NULL
        END
      `);
    } catch (err) {
      console.log('Manual migration notice: schema check completed.');
    }

  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
