const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

router.post('/elastic-search', searchController.search);
// router.post('/optimized-search', searchController.optimizedSearch);

module.exports = router;
