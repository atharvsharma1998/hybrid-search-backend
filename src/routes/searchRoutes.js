/**
 * Route definitions for search-related operations.
 * 
 * This module defines the routes for performing searches. It links the POST request
 * for /api/elastic-search to the search controller's `search` function.
 */

const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Route for performing a search using Elasticsearch
router.post('/elastic-search', searchController.search);

module.exports = router;
