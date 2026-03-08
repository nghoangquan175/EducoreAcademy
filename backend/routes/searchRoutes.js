const express = require('express');
const router = express.Router();
const { searchContent } = require('../controllers/searchController');

router.route('/').get(searchContent);

module.exports = router;
