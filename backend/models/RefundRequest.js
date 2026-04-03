const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RefundRequest = sequelize.define('RefundRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  paymentOrderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'vnpay_failed'),
    defaultValue: 'pending'
  },
  adminNote: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  processedByAdminId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  vnpayResponseCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  vnpayTransactionNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Snapshot of amounts to be reversed
  reversedAdminAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  },
  reversedInstructorAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = RefundRequest;
