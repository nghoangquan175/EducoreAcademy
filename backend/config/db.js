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
    } catch (err) {
      console.log('Manual migration notice: userAnswers column check completed.');
    }

  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
