/**
 * Controller module for handling search requests.
 * 
 * This controller handles the POST requests to the /api/elastic-search endpoint.
 * It retrieves the search query and vector from the request body, invokes the search
 * service, and sends the results back to the client.
 */

const searchService = require('../services/searchService');

/**
 * Handle search requests and send results back to the client.
 * 
 * @param {Object} req - The request object containing the search query and vector.
 * @param {Object} res - The response object used to send data back to the client.
 */
async function search(req, res) {
    console.log('calling search');

    const { query, vector } = req.body;
    console.log('calling search');
        // Validate the request body
        // if (!query || !vector) {
        //     return res.status(400).json({ error: 'Both query and vector are required.' });
        // }

    // try {
    //     const { results, timeTaken } = await searchService.hybridSearch(query, vector);
    //     res.status(200).json({ results, timeTaken });
    // } catch (error) {
    //     console.error('Error during normal search:', error);
    //     res.status(500).json({error: error.message });
    // }
    try {
        const { results, timeTaken } = await searchService.hybridSearch(query, vector);
        res.status(200).json({ results, timeTaken });
    } catch (error) {
        console.error('Error during search:', error);

        // Handle specific Elasticsearch errors
        if (error.meta && error.meta.statusCode === 400) {
            res.status(400).json({ error: error.meta.body.error.reason });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = { search };
