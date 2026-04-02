require('dotenv').config();
const { sequelize } = require('./config/db');

async function syncModerationSchema() {
  try {
    console.log('--- Starting Moderation Schema Sync ---');

    // 1. Update Comments table
    console.log('Updating [Comments] table...');
    const commentColumns = [
      "ALTER TABLE [Comments] ADD [status] NVARCHAR(20) NOT NULL DEFAULT 'PUBLISHED';",
      "ALTER TABLE [Comments] ADD [moderationSource] NVARCHAR(50) NULL;",
      "ALTER TABLE [Comments] ADD [moderationReason] NVARCHAR(500) NULL;",
      "ALTER TABLE [Comments] ADD [likeCount] INT NOT NULL DEFAULT 0;",
      "ALTER TABLE [Comments] ADD [heartCount] INT NOT NULL DEFAULT 0;",
      "ALTER TABLE [Comments] ADD [helpfulCount] INT NOT NULL DEFAULT 0;"
    ];

    for (const sql of commentColumns) {
      try {
        await sequelize.query(sql);
        console.log(`Success: ${sql}`);
      } catch (e) {
        console.log(`Skip/Error: ${e.message}`);
      }
    }

    // 2. Update Users table
    console.log('\nUpdating [Users] table...');
    const userColumns = [
      "ALTER TABLE [Users] ADD [reputationScore] INT NOT NULL DEFAULT 100;",
      "ALTER TABLE [Users] ADD [mutedUntil] DATETIME NULL;"
    ];

    for (const sql of userColumns) {
      try {
        await sequelize.query(sql);
        console.log(`Success: ${sql}`);
      } catch (e) {
        console.log(`Skip/Error: ${e.message}`);
      }
    }

    // 3. Create CommentReactions table
    console.log('\nCreating [CommentReactions] table...');
    const createTableSql = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CommentReactions' AND xtype='U')
      CREATE TABLE [CommentReactions] (
        [id] INT PRIMARY KEY IDENTITY(1,1),
        [userId] INT NOT NULL,
        [commentId] INT NOT NULL,
        [type] NVARCHAR(20) NOT NULL,
        [createdAt] DATETIME NOT NULL,
        [updatedAt] DATETIME NOT NULL,
        CONSTRAINT [FK_CommentReactions_User] FOREIGN KEY ([userId]) REFERENCES [Users]([id]),
        CONSTRAINT [FK_CommentReactions_Comment] FOREIGN KEY ([commentId]) REFERENCES [Comments]([id]),
        CONSTRAINT [UQ_User_Comment] UNIQUE ([userId], [commentId])
      );
    `;
    try {
      await sequelize.query(createTableSql);
      console.log('Success: Created [CommentReactions] table');
    } catch (e) {
      console.log(`Error creating table: ${e.message}`);
    }

    console.log('\n--- Sync Finished ---');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during sync:', err);
    process.exit(1);
  }
}

syncModerationSchema();
