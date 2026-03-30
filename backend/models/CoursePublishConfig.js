const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CoursePublishConfig = sequelize.define('CoursePublishConfig', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false,
    references: {
      model: 'Courses',
      key: 'id',
    },
  },
  isPro: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  },
  salePrice: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  },
  discountPercent: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  createdByAdminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
}, {
  timestamps: true,
  tableName: 'CoursePublishConfigs',
});

module.exports = CoursePublishConfig;
