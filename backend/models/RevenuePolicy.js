const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RevenuePolicy = sequelize.define('RevenuePolicy', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Courses',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('PERCENT', 'FIXED', 'HYBRID'),
    allowNull: false,
  },
  instructorPercent: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fixedAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  upfrontAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'waiting_confirm', 'accepted', 'rejected', 'waiting_delete'),
    defaultValue: 'draft',
  },
  createdByAdminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  confirmedByInstructorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'RevenuePolicies',
});

module.exports = RevenuePolicy;
