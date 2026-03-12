const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const QuizAttempt = sequelize.define('QuizAttempt', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('passed', 'failed'),
    allowNull: false,
  },
  userAnswers: {
    type: DataTypes.TEXT, // Store chosen indices as JSON string for MSSQL compatibility
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('userAnswers');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('userAnswers', JSON.stringify(value));
    }
  }
});

module.exports = QuizAttempt;
