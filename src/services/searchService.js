/**
 * Service module for performing search operations with Elasticsearch.
 * 
 * This service connects to an Elasticsearch instance and performs a hybrid search
 * that combines keyword-based and vector-based search methods. The results are then
 * returned to the controller.
 */

const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Initialize Elasticsearch client with configuration from environment variables
const client = new Client({ 
    node: process.env.ELASTICSEARCH_NODE,
    auth: {
        apiKey: process.env.ELASTICSEARCH_API_KEY
      }
 });

 /**
 * Perform a hybrid search using both keyword and vector queries.
 * 
 * @param {string} keywordQuery - The keyword search query.
 * @param {Array<number>} vectorQuery - The vector search query.
 * @returns {Object} The search results and time taken.
 * @throws Will throw an error if the Elasticsearch query fails.
 */
 const hybridSearch = async (keywordQuery, vectorQuery) => {

    // Define the search query body using Elasticsearch's RRF retriever
    // https://www.elastic.co/guide/en/elasticsearch/reference/current/rrf.html
    const searchBody = {
        "retriever": {
            "rrf": { 
                "retrievers": [
                    {
                        "standard": { 
                            "query": {
                                "multi_match": {
                                    "query": keywordQuery,
                                    "fields": ["title", "author", "content.text"]
                                }
                            }
                        }
                    },
                    {
                        "knn": { 
                            "field": "content.vector_representation",
                            "query_vector": vectorQuery,
                            "k": 50,
                            "num_candidates": 50
                        }
                    }
                ],
                "rank_window_size": 50,
                "rank_constant": 20
            }
        }
    };

    try {
        // Perform the search operation in the specified index
        const response = await client.search({
            index: 'magazine_data', // Index name
            body: searchBody,  // Limit the number of results returned
            size: 10  // Limit the number of results returned
        });
    
        // Logging the entire response for debugging
        console.log('Elasticsearch response:', response);

        // console.log('Elasticsearch response:', JSON.stringify(response, null, 2));
        console.log(`Time Taken: ${response.took}`);
    
        // Parsing response and return relevant data
        if (response.hits && response.hits.hits.length > 0) {
            const results = response.hits.hits.map(hit => ({
                id: hit._id,
                title: hit._source.title,
                author: hit._source.author,
                content: hit._source.content.map(content => content.text),
                relevance: hit._score,
            }));
    
            return { results , timeTaken: response.took};

        } else {
            return { results: [] , timeTaken: 0}; // Return empty results with 0 time if no hits
        }
    } catch (error) {
        console.error('Elasticsearch search error:', error);
        throw error;    // throwing the error to the controller
    }
    
};

module.exports = { hybridSearch };













