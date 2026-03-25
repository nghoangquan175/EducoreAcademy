const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mssql',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  dialectOptions: {
    options: {
      encrypt: true,
      trustServerCertificate: true,
      requestTimeout: 60000 // Increase to 60s
    }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false
});

const connectDB = async () => {
  try {
    // Sync — force:false to avoid dropping existing data.
    await sequelize.sync({ force: false });
    console.log('Database synced');

  } catch (error) {
    console.error('Unable to connect to the database:');
    console.error(error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
