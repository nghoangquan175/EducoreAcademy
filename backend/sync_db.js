require('dotenv').config();
const { sequelize } = require('./config/db');

async function syncDB() {
  try {
    await sequelize.authenticate();
    console.log('Connection established.');
    
    // Using raw SQL to ensure it works on MSSQL
    const queries = [
      "ALTER TABLE PaymentOrders ADD adminAmount DECIMAL(18,2) NULL;",
      "ALTER TABLE PaymentOrders ADD instructorAmount DECIMAL(18,2) NULL;",
      "ALTER TABLE PaymentOrders ADD revenuePolicyId INT NULL;"
    ];

    for (let query of queries) {
      try {
        await sequelize.query(query);
        console.log('Executed:', query);
      } catch (err) {
        // Ignored if column already exists
        console.log('Skipped (might already exist):', err.message);
      }
    }
    console.log('Database altered successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

syncDB();
