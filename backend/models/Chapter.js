const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Chapter = sequelize.define('Chapter', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  chapterOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  // courseId là foreign key - sẽ được thêm tự động qua Association
});

module.exports = Chapter;
