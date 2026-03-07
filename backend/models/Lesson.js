const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  videoUrl: {
    type: DataTypes.STRING
  },
  content: {
    type: DataTypes.TEXT
  },
  lessonOrder: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = Lesson;
