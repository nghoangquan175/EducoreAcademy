const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  passingScore: {
    type: DataTypes.INTEGER,
    defaultValue: 80, // percentage
  }
});

module.exports = Quiz;
