const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  options: {
    type: DataTypes.TEXT, // Changed from JSON for MSSQL compatibility
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('options');
      if (!rawValue) return [];
      try {
        const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error("Error parsing options JSON:", err);
        return [];
      }
    },
    set(value) {
      this.setDataValue('options', JSON.stringify(value));
    }
  },
  correctOptionIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
});

module.exports = Question;
