const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudyGoal = sequelize.define('StudyGoal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING, // 'Live Class', 'Assignment', 'Meeting', 'Task'
    allowNull: false,
    defaultValue: 'Task'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time: {
    type: DataTypes.STRING,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '#3b82f6'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

module.exports = StudyGoal;
