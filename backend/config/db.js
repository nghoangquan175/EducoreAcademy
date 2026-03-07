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
    await sequelize.authenticate();
    console.log('SQL Server Database Connected...');

    // Sync models
    await sequelize.sync({ alter: true });
    console.log('Database synced');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
