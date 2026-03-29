const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PaymentOrder = sequelize.define('PaymentOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  adminAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  },
  instructorAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  },
  revenuePolicyId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'paid', 'failed']]
    }
  }
}, {
  timestamps: true
});

module.exports = PaymentOrder;
