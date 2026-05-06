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
  suggestedPrice: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  pricePerPurchase: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  upfrontAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  additionalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('draft', 'waiting_confirm', 'accepted', 'rejected', 'waiting_delete', 'outdated'),
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
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'RevenuePolicies',
});

module.exports = RevenuePolicy;
