require('dotenv').config();
const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

const migrate = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = 'Users';

  try {
    const tableInfo = await queryInterface.describeTable(tableName);

    if (!tableInfo.tokenVersion) {
      await queryInterface.addColumn(tableName, 'tokenVersion', {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
      console.log('Added tokenVersion column');
    }

    if (!tableInfo.lastLoginAt) {
      await queryInterface.addColumn(tableName, 'lastLoginAt', {
        type: DataTypes.DATE,
        allowNull: true
      });
      console.log('Added lastLoginAt column');
    }

    if (!tableInfo.rapidLoginCount) {
      await queryInterface.addColumn(tableName, 'rapidLoginCount', {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
      console.log('Added rapidLoginCount column');
    }

    if (!tableInfo.loginViolationCount) {
      await queryInterface.addColumn(tableName, 'loginViolationCount', {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
      console.log('Added loginViolationCount column');
    }

    if (!tableInfo.lockedUntil) {
      await queryInterface.addColumn(tableName, 'lockedUntil', {
        type: DataTypes.DATE,
        allowNull: true
      });
      console.log('Added lockedUntil column');
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
