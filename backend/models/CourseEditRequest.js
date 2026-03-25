const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CourseEditRequest = sequelize.define('CourseEditRequest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  contentSummary: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
    defaultValue: 'pending',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = CourseEditRequest;
