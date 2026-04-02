const { User } = require('../models');
const { Op } = require('sequelize');

const PENALTIES = {
    BLACKLIST: 10,
    AI_TOXIC: 15,
    LINK_FILTER: 5,
    SPAM: 10
};

const REWARDS = {
    HELPFUL_COMMENT: 2,   // When someone reacts HELPFUL to user's comment
    COMMENT_LIKED: 1,      // When someone reacts LIKE to user's comment
    COURSE_COMPLETED: 5,
    QUIZ_PASSED: 2,
    ARTICLE_PUBLISHED: 3
};

const THRESHOLDS = {
    WARNING: 70,
    BLOCK_COMMENT: 50,
    MUTE_USER: 20
};

/**
 * Update user reputation score and check for threshold actions
 */
async function adjustReputation(userId, amount, reason = '') {
    try {
        const user = await User.findByPk(userId);
        if (!user) return;

        let newScore = (user.reputationScore || 100) + amount;

        // Clamp between 0 and 100
        newScore = Math.max(0, Math.min(100, newScore));

        const updates = { reputationScore: newScore };

        // Handle auto-mute logic based on new score
        if (amount < 0) { // Only check for mutes on penalty
            const now = new Date();
            if (newScore < THRESHOLDS.MUTE_USER) {
                // Mute for 7 days
                updates.mutedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            } else if (newScore < THRESHOLDS.BLOCK_COMMENT) {
                // Mute for 1 day
                updates.mutedUntil = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
            }
        }

        await user.update(updates);


        return { score: newScore, mutedUntil: updates.mutedUntil };
    } catch (error) {
        console.error('Error adjusting reputation:', error);
    }
}

/**
 * Check if a user is currently muted
 */
function isUserMuted(user) {
    if (!user.mutedUntil) return false;
    return new Date(user.mutedUntil) > new Date();
}

/**
 * Utility to reset user reputation (Admin Action)
 */
async function resetReputation(userId) {
    const user = await User.findByPk(userId);
    if (user) {
        await user.update({
            reputationScore: 100,
            mutedUntil: null
        });
    }
}

module.exports = {
    PENALTIES,
    REWARDS,
    THRESHOLDS,
    adjustReputation,
    isUserMuted,
    resetReputation
};
