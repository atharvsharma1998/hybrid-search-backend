const searchService = require('../services/searchService');

async function search(req, res) {
    console.log('calling search');

    const { query, vector } = req.body;
    console.log('calling search');

    try {
        const { results, timeTaken } = await searchService.hybridSearch(query, vector);
        res.status(200).json({ results, timeTaken });
    } catch (error) {
        console.error('Error during normal search:', error);
        res.status(500).json({error: error.message });
    }
}

// async function optimizedSearch(req, res) {
//     const { query, vector } = req.body;

//     try {
//         const { results, timeTaken } = await searchService.hybridSearchOptimized(query, vector);
//         res.status(200).json({ results, timeTaken });
//     } catch (error) {
//         console.error('Error during optimized search:', error);
//         res.status(500).json({ error: error.message });
//     }
// }

module.exports = { search };
