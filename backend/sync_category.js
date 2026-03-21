require('dotenv').config();
const { sequelize } = require('./config/db');
const { Category } = require('./models');

(async () => {
  try {
    await Category.sync();
    console.log("Category table synced");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
