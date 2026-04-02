const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CommentReaction = sequelize.define('CommentReaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['LIKE', 'HEART', 'HELPFUL']]
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'commentId'] // 1 user = 1 reaction per comment
    }
  ]
});

module.exports = CommentReaction;
