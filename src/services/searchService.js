const db = require('../utils/db');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({ 
    node: process.env.ELASTICSEARCH_NODE,
    auth: {
        apiKey: process.env.ELASTICSEARCH_API_KEY
      }
 });

 const hybridSearch = async (keywordQuery, vectorQuery) => {
    // const startOptimized = Date.now();

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
        const response = await client.search({
            index: 'magazine_data',
            body: searchBody,  // This is the query body
            size: 10  // Adjust as necessary
        });
    
        // Logging the entire response for debugging
        console.log('Elasticsearch response:', response);

        // console.log('Elasticsearch response:', JSON.stringify(response, null, 2));
    
        // Directly access `hits` from the response
        if (response.hits && response.hits.hits.length > 0) {
            const results = response.hits.hits.map(hit => ({
                id: hit._id,
                title: hit._source.title,
                author: hit._source.author,
                content: hit._source.content.map(content => content.text),
                relevance: hit._score,
                timeTaken: response.took
            }));
    
            return { results };

        } else {
            return { results: [] }; // Return empty results with 0 time if no hits
        }
    } catch (error) {
        console.error('Elasticsearch search error:', error);
        throw error;
    }
    
};

module.exports = { hybridSearch };

// const hybridSearch = async (query, vector) => {
//     const sql = `
//         SELECT 
//             m.id, 
//             m.title, 
//             m.author, 
//             mc.content,
//             (0.5 * (
//                 CASE 
//                     WHEN m.title ILIKE '%$1:value%' 
//                         OR m.author ILIKE '%$1:value%' 
//                         OR mc.content ILIKE '%$1:value%' 
//                     THEN 1 ELSE 0 END
//             )) + 
//             (0.5 * (1 - (mc.vector_representation <=> $2::vector))) AS relevance
//         FROM 
//             magazines m
//         JOIN 
//             magazine_content mc 
//         ON 
//             m.id = mc.magazine_id
//         WHERE 
//             m.title ILIKE '%$1:value%' 
//             OR m.author ILIKE '%$1:value%' 
//             OR mc.content ILIKE '%$1:value%'
//         ORDER BY 
//             relevance DESC
//         LIMIT 10;
//     `;

//     const results = await db.any(sql, [query, vector]);
//     return results;
// };

// const hybridSearch = async (query, vector) => {
//     const startUnoptimized = Date.now();

//     const sql = `
//         SELECT 
//             m.id, 
//             m.title, 
//             m.author, 
//             mc.content,
//             (0.5 * (
//                 CASE 
//                     WHEN m.title ILIKE '%$1:value%' 
//                         OR m.author ILIKE '%$1:value%' 
//                         OR mc.content ILIKE '%$1:value%' 
//                     THEN 1 ELSE 0 END
            
//                     )
//             ) + 
//             (0.5 * (1 - (mc.vector_representation <=> $2::vector))) AS relevance
//         FROM 
//             magazines m
//         JOIN 
//             magazine_content mc 
//         ON 
//             m.id = mc.magazine_id
//         WHERE 
//             m.title ILIKE '%$1:value%' 
//             OR m.author ILIKE '%$1:value%' 
//             OR mc.content ILIKE '%$1:value%'
//         ORDER BY 
//             relevance DESC
//         LIMIT 10;
//     `;

//     const results = await db.any(sql, [query, vector]);
//     const endUnoptimized = Date.now();
//     const durationUnoptimized = endUnoptimized - startUnoptimized;

//     return {results: results, timeTaken: durationUnoptimized};
// };


// async function hybridSearchOptimized(query, vector) {
//     // Combined keyword and vector-based search
//     const startUnoptimized = Date.now();

//     const sql = `
// SELECT 
//     m.id, 
//     m.title, 
//     m.author, 
//     mc.content,
//     (0.5 * (
//         CASE 
//             WHEN to_tsvector('english', m.title || ' ' || m.author) @@ plainto_tsquery('english', $1)
//                 OR to_tsvector('english', mc.content) @@ plainto_tsquery('english', $1)
//             THEN 1 ELSE 0 END
//     )) + 
//     (0.5 * (1 - (mc.vector_representation <=> $2::vector))) AS relevance
// FROM 
//     magazines_optimized m
// JOIN 
//     magazine_content_optimized mc 
// ON 
//     m.id = mc.magazine_id
// WHERE 
//     to_tsvector('english', m.title || ' ' || m.author) @@ plainto_tsquery('english', $1)
//     OR to_tsvector('english', mc.content) @@ plainto_tsquery('english', $1)
// ORDER BY 
//     relevance DESC
// LIMIT 10;
//     `;
//     // Execute the combined query

//     const results = await db.any(sql, [query, vector]);
//     const endUnoptimized = Date.now();
//     const durationUnoptimized = endUnoptimized - startUnoptimized;


//     return {results: results, timeTaken: durationUnoptimized};
// }


// const hybridSearch = async (query, vector) => {
//     const startOptimized = Date.now();

//     const sql = `
//         WITH keyword_search AS (
//             SELECT 
//                 m.id, 
//                 m.title, 
//                 m.author, 
//                 mc.content,
//                 (CASE 
//                     WHEN to_tsvector(m.title || ' ' || m.author || ' ' || mc.content) @@ plainto_tsquery($1) 
//                     THEN 1 ELSE 0 END) AS keyword_relevance
//             FROM 
//                 magazines m
//             JOIN 
//                 magazine_content mc 
//             ON 
//                 m.id = mc.magazine_id
//             WHERE 
//                 to_tsvector(m.title || ' ' || m.author || ' ' || mc.content) @@ plainto_tsquery($1)
//         )
//         SELECT 
//             ks.id, 
//             ks.title, 
//             ks.author, 
//             ks.content,
//             (0.5 * ks.keyword_relevance + 
//             0.5 * (1 - (mc.vector_representation <=> $2::vector))) AS relevance
//         FROM 
//             keyword_search ks
//         JOIN 
//             magazine_content mc 
//         ON 
//             ks.id = mc.magazine_id
//         ORDER BY 
//             relevance DESC
//         LIMIT 10;
//     `;

//     const results = await db.any(sql, [query, vector]);
//     const endOptimized = Date.now();
//     const durationOptimized = endOptimized - startOptimized;

//     return {results: results, timeTaken: durationOptimized};
// };

// async function hybridSearchOptimized(query, vector) {
//     const startUnoptimized = Date.now();

//     // const sql = `
//     //     WITH KeywordSearch AS (
//     //         SELECT
//     //             m.id AS magazine_id,
//     //             m.title,
//     //             m.author,
//     //             mc.content,
//     //             ts_rank_cd(
//     //                 setweight(to_tsvector('english', m.title), 'A') ||
//     //                 setweight(to_tsvector('english', m.author), 'B') ||
//     //                 setweight(to_tsvector('english', mc.content), 'C'),
//     //                 plainto_tsquery('english', $1)
//     //             ) AS keyword_rank
//     //         FROM
//     //             magazines_optimized m
//     //         JOIN
//     //             magazine_content_optimized mc ON m.id = mc.magazine_id
//     //         WHERE
//     //     to_tsvector('english', m.title) @@ plainto_tsquery('english', $1) OR
//     //     to_tsvector('english', m.author) @@ plainto_tsquery('english', $1) OR
//     //     to_tsvector('english', mc.content) @@ plainto_tsquery('english', $1)
//     //     ),
//     //     VectorSearch AS (
//     //         SELECT
//     //             mc.magazine_id,
//     //             1 - (mc.vector_representation <=> $2::vector) AS vector_rank
//     //         FROM
//     //             magazine_content_optimized mc
//     //         ORDER BY
//     //             vector_rank DESC
//     //         LIMIT 10
//     //     )
//     //     SELECT
//     //         ks.magazine_id AS id,
//     //         ks.title,
//     //         ks.author,
//     //         ks.content,
//     //         (ks.keyword_rank + vs.vector_rank) / 2 AS relevance
//     //     FROM
//     //         KeywordSearch ks
//     //     JOIN
//     //         VectorSearch vs ON ks.magazine_id = vs.magazine_id
//     //     ORDER BY
//     //         relevance DESC
//     //     LIMIT 10;
//     // `;


//     const sql = `
//     SELECT 
//     m.id, 
//     m.title, 
//     m.author, 
//     mc.content,
//     0.5 * (
//         CASE 
//             WHEN to_tsvector('english', m.title) @@ plainto_tsquery('english', 'Focus miss debate')
//                 OR to_tsvector('english', m.author) @@ plainto_tsquery('english', 'Focus miss debate')
//                 OR to_tsvector('english', mc.content) @@ plainto_tsquery('english', 'Focus miss debate')
//             THEN 1 ELSE 0 END
//     ) + 
//        (0.5 * (1 - (mc.vector_representation <=> '[0.333, 0.914, 0.986, 0.298, 0.202, 0.994, 0.18, 0.049, 0.081, 0.633, 0.801, 0.553, 0.87, 0.204, 0.233, 0.402, 0.919, 0.036, 0.036, 0.611, 0.644, 0.81, 0.065, 0.455, 0.245, 0.308, 0.121, 0.145, 0.021, 0.909, 0.75, 0.783, 0.857, 0.742, 0.659, 0.529, 0.151, 0.82, 0.616, 0.812, 0.692, 0.583, 0.928, 0.02, 0.272, 0.868, 0.326, 0.207, 0.274, 0.414, 0.312, 0.948, 0.042, 0.318, 0.535, 0.195, 0.733, 0.786, 0.858, 0.775, 0.72, 0.453, 0.287, 0.692, 0.307, 0.253, 0.562, 0.135, 0.067, 0.692, 0.745, 0.829, 0.034, 0.55, 0.524, 0.3, 0.024, 0.298, 0.133, 0.609, 0.185, 0.331, 0.09, 0.303, 0.426, 0.952, 0.344, 0.97, 0.681, 0.573, 0.385, 0.992, 0.213, 0.059, 0.094, 0.411, 0.066, 0.915, 0.461, 0.273, 0.958, 0.571, 0.038, 0.125, 0.412, 0.937, 0.406, 0.217, 0.338, 0.947, 0.659, 0.241, 0.209, 0.088, 0.846, 0.01, 0.652, 0.207, 0.05, 0.586, 0.253, 0.778, 0.532, 0.762, 0.966, 0.854, 0.174, 0.252, 0.18, 0.141, 0.388, 0.163, 0.56, 0.797, 0.84, 0.401, 0.703, 0.701, 0.516, 0.968, 0.682, 0.38, 0.457, 0.798, 0.438, 0.877, 0.928, 0.651, 0.881, 0.114, 0.384, 0.964, 0.112, 0.259, 0.849, 0.031, 0.412, 0.231, 0.421, 0.184, 0.662, 0.008, 0.433, 0.594, 0.913, 0.124, 0.672, 0.012, 0.062, 0.927, 0.62, 0.943, 0.176, 0.013, 0.283, 0.494, 0.197, 0.323, 0.011, 0.146, 0.384, 0.736, 0.271, 0.19, 0.686, 0.457, 0.303, 0.53, 0.441, 0.458, 0.448, 0.311, 0.306, 0.515, 0.448, 0.236, 0.464, 0.569, 0.275, 0.392, 0.763, 0.027, 0.423, 0.425, 0.207, 0.567, 0.237, 0.638, 0.764, 0.299, 0.928, 0.804, 0.774, 0.045, 0.137, 0.268, 0.233, 0.238, 0.26, 0.204, 0.509, 0.295, 0.87, 0.514, 0.302, 0.043, 0.872, 0.698, 0.998, 0.285, 0.85, 0.976, 0.827, 0.702, 0.647, 0.628, 0.434, 0.169, 0.745, 0.675, 0.929, 0.545, 0.148, 0.484, 0.948, 0.459, 0.803, 0.547, 0.284, 0.136, 0.614, 0.598, 0.756, 0.718, 0.504, 0.142, 0.38, 0.2, 0.573, 0.348, 0.396, 0.869, 0.864, 0.361, 0.032, 0.564, 0.487, 0.865, 0.446, 0.435, 0.536, 0.965, 0.357, 0.643, 0.415, 0.7, 0.391, 0.106, 0.62, 0.315, 0.461, 0.024, 0.635, 0.826, 0.192, 0.451, 0.016, 0.443, 0.89, 0.14, 0.62, 0.026, 0.864, 0.888, 0.615, 0.773, 0.722, 0.867, 0.221, 0.184, 0.279, 0.851, 0.932, 0.255, 0.754, 0.798, 0.769, 0.419, 0.171, 0.399, 0.011, 0.015, 0.584, 0.942, 0.839, 0.91, 0.985, 0.766, 0.151, 0.292, 0.284, 0.38, 0.047, 0.297, 0.643, 0.993, 0.405, 0.497, 0.597, 0.9, 0.483, 0.791, 0.03, 0.807, 0.096, 0.509, 0.154, 0.212, 0.001, 0.994, 0.332, 0.108, 0.698, 0.712, 0.441, 0.061, 0.779, 0.12, 0.759, 0.224, 0.423, 0.855, 0.927, 0.355, 0.316, 0.381, 0.768, 0.678, 0.416, 0.546, 0.505, 0.544, 0.224, 0.42, 0.401, 0.641, 0.667, 0.793, 0.752, 0.796, 0.719, 0.62, 0.835, 0.067, 0.133, 0.522, 0.251, 0.484, 0.26, 0.21, 0.64, 0.952, 0.087, 0.159, 0.514, 0.359, 0.7, 0.071, 0.733, 0.956, 0.322, 0.644, 0.854, 0.254, 0.77, 0.247, 0.247, 0.838, 0.315, 0.682, 0.78, 0.173, 0.517, 0.294, 0.424, 0.476, 0.103, 0.046, 0.526, 0.994, 0.755, 0.075, 0.61, 0.613, 0.692, 0.326, 0.661, 0.162, 0.849, 0.342, 0.645, 0.68, 0.875, 0.295, 0.685, 0.758, 0.044, 0.751, 0.859, 0.961, 0.608, 0.939, 0.684, 0.964, 0.078, 0.668, 0.697, 0.258, 0.229, 0.082, 0.03, 0.977, 0.04, 0.155, 0.122, 0.997, 0.461, 0.713, 0.847, 0.87, 0.876, 0.905, 0.556, 0.652, 0.795, 0.458, 0.639, 0.191, 0.732, 0.698, 0.699, 0.464, 0.349, 0.565, 0.095, 0.881, 0.483, 0.764, 0.156, 0.571, 0.599, 0.004, 0.699, 0.382, 0.028, 0.302, 0.349, 0.428, 0.514, 0.326, 0.859, 0.665, 0.673, 0.165, 0.961, 0.306, 0.85, 0.952, 0.838, 0.526, 0.481, 0.7, 0.469, 0.901, 0.129, 0.738, 0.986, 0.524, 0.401, 0.883, 0.306, 0.675, 0.511, 0.428, 0.512, 0.874, 0.889, 0.989, 0.164, 0.866, 0.286, 0.252, 0.309, 0.613, 0.681, 0.938, 0.285, 0.588, 0.078, 0.174, 0.328, 0.134, 0.977, 0.667, 0.648, 0.181, 0.011, 0.487, 0.565, 0.012, 0.504, 0.755, 0.587, 0.346, 0.041, 0.466, 0.389, 0.834, 0.295, 0.391, 0.682, 0.024, 0.055, 0.945, 0.854, 0.721, 0.569, 0.35, 0.504, 0.803, 0.88, 0.753, 0.021, 0.642, 0.368, 0.224, 0.364, 0.571, 0.753, 0.821, 0.882, 0.028, 0.833, 0.655, 0.4, 0.712, 0.589, 0.259, 0.323, 0.144, 0.628, 0.474, 0.073, 0.138, 0.146, 0.214, 0.299, 0.525, 0.433, 0.232, 0.731, 0.736, 0.189, 0.825, 0.299, 0.172, 0.626, 0.921, 0.243, 0.129, 0.81, 0.87, 0.416, 0.785, 0.349, 0.461, 0.746, 0.138, 0.627, 0.418, 0.946, 0.883, 0.23, 0.598, 0.529, 0.748, 0.362, 0.837, 0.506, 0.546, 0.15, 0.348, 0.99, 0.458, 0.244, 0.432, 0.671, 0.604, 0.055, 0.147, 0.514, 0.899, 0.755, 0.122, 0.55, 0.112, 0.83, 0.241, 0.583, 0.179, 0.151, 0.158, 0.613, 0.495, 0.501, 0.276, 0.481, 0.56, 0.079, 0.431, 0.738, 0.268, 0.08, 0.038, 0.208, 0.276, 0.868, 0.894, 0.131, 0.257, 0.322, 0.284, 0.445, 0.983, 0.46, 0.057, 0.24, 0.49, 0.254, 0.737, 0.117, 0.056, 0.82, 0.118, 0.992, 0.199, 0.241, 0.505, 0.573, 0.908, 0.377, 0.665, 0.912, 0.593, 0.167, 0.58, 0.034, 0.822, 0.813, 0.85, 0.933, 0.191, 0.302, 0.396, 0.521, 0.319, 0.525, 0.651, 0.58, 0.235, 0.656, 0.067, 0.939, 0.642, 0.959, 0.395, 0.729, 0.434, 0.616, 0.268, 0.108, 0.139, 0.568, 0.402, 0.072, 0.253, 0.821, 0.414, 0.88, 0.668, 0.195, 0.276, 0.184, 0.411, 0.369, 0.906, 0.667, 0.278, 0.654, 0.81, 0.336, 0.402, 0.497, 0.868, 0.456, 0.777, 0.089, 0.593, 0.682, 0.129, 0.982, 0.726, 0.853, 0.661, 0.109, 0.928, 0.595, 0.249, 0.988, 0.929, 0.295, 0.765, 0.9, 0.551, 0.625, 0.516, 0.324, 0.597, 0.007, 0.033, 0.6, 0.819, 0.202, 0.202, 0.646, 0.412, 0.852, 0.536, 0.32, 0.359, 0.356, 0.927, 0.851, 0.651, 0.248, 0.535, 0.176, 0.682, 0.582, 0.611, 0.753, 0.725, 0.661, 0.543, 0.537, 0.195, 0.826, 0.442, 0.301, 0.376, 0.467, 0.98, 0.092, 0.739, 0.381, 0.315, 0.567, 0.73, 0.904, 0.857, 0.791, 0.013, 0.291, 0.889, 0.329, 0.25, 0.173, 0.736, 0.712, 0.009, 0.998, 0.062, 0.585, 0.891, 0.866, 0.521, 0.923, 0.544, 0.442, 0.853, 0.552, 0.43, 0.244, 0.606, 0.425, 0.274, 0.439, 0.789, 0.886, 0.908, 0.209, 0.644, 0.553, 0.447, 0.834, 0.041, 0.107, 0.044, 0.49, 0.918, 0.793, 0.281, 0.283, 0.332, 0.064, 0.881, 0.046, 0.369, 0.375, 0.678, 0.509, 0.837, 0.17, 0.363, 0.11, 0.86, 0.472, 0.033, 0.718, 0.224, 0.523, 0.92, 0.041, 0.535, 0.531, 0.76, 0.911, 0.178, 0.759, 0.079, 0.038, 0.034, 0.265, 0.065, 0.293, 0.367, 0.662, 0.62, 0.296, 0.468, 0.967, 0.848, 0.017, 0.159, 0.391, 0.851, 0.364, 0.484, 0.541, 0.247, 0.517, 0.621, 0.671, 0.574, 0.453, 0.795, 0.733, 0.111, 0.351, 0.836, 0.118, 0.327, 0.299, 0.737, 0.804, 0.862, 0.179, 0.899, 0.91, 0.676, 0.302, 0.365, 0.762, 0.399, 0.964, 0.939, 0.495, 0.514, 0.098, 0.034, 0.95, 0.505, 0.315, 0.116, 0.52, 0.947, 0.107, 0.901, 0.247, 0.518, 0.627, 0.926, 0.17, 0.936, 0.79, 0.73, 0.061, 0.854, 0.482, 0.563, 0.557, 0.768, 0.458, 0.31, 0.684, 0.45, 0.874, 0.791, 0.871, 0.912, 0.349, 0.839, 0.722, 0.829, 0.542, 0.183, 0.344, 0.193, 0.031, 0.881, 0.141, 0.13, 0.037, 0.75, 0.695, 0.689, 0.15, 0.13, 0.703, 0.334, 0.517, 0.668, 0.644, 0.783, 0.404, 0.636, 0.716, 0.966, 0.966, 0.748, 0.611, 0.178, 0.93, 0.062, 0.94, 0.359, 0.294, 0.374, 0.766, 0.574, 0.214, 0.249, 0.698, 0.036, 0.536, 0.394, 0.835, 0.417, 0.048, 0.68, 0.387, 0.707, 0.445, 0.458, 0.303, 0.75, 0.36, 0.11, 0.253, 0.345, 0.298, 0.043, 0.442, 0.057, 0.411, 0.074, 0.425, 0.059, 0.933, 0.158, 0.781, 0.655, 0.8, 0.49, 0.893, 0.277, 0.904, 0.183, 0.725, 0.517, 0.212, 0.545, 0.241, 0.976, 0.833, 0.018, 0.096, 0.713, 0.029, 0.45, 0.547, 0.497, 0.963, 0.556, 0.099, 0.455, 0.415, 0.193, 0.179, 0.883, 0.905, 0.73, 0.364, 0.847, 0.408, 0.297, 0.018, 0.37, 0.946, 0.938, 0.336, 0.751, 0.313, 0.387, 0.682, 0.295, 0.355, 0.036, 0.704, 0.302, 0.387, 0.963, 0.888, 0.017, 0.821, 0.052, 0.685, 0.99, 0.751, 0.383, 0.156, 0.019, 0.954, 0.049, 0.804, 0.792, 0.408, 0.751, 0.292, 0.921, 0.454, 0.931, 0.979, 0.137, 0.823, 0.844, 0.708, 0.077, 0.778, 0.821, 0.897, 0.239, 0.781, 0.202, 0.335, 0.688, 0.201, 0.184, 0.7, 0.036, 0.912, 0.809, 0.328, 0.492, 0.995, 0.382, 0.368, 0.437, 0.535, 0.185, 0.994, 0.27, 0.284, 0.737, 0.625, 0.862, 0.956, 0.994, 0.594, 0.95, 0.103, 0.361, 0.228, 0.536, 0.685, 0.358, 0.932, 0.812, 0.153, 0.334, 0.109, 0.378, 0.935, 0.588, 0.897, 0.679, 0.282, 0.738, 0.28, 0.829, 0.961, 0.285, 0.295, 0.698, 0.196, 0.221, 0.187, 0.228, 0.899, 0.635, 0.533, 0.102, 0.752, 0.784, 0.602, 0.747, 0.581, 0.214, 0.054, 0.764, 0.163, 0.654, 0.323, 0.54, 0.656, 0.045, 0.431, 0.375, 0.242, 0.915, 0.284, 0.632, 0.791, 0.568, 0.426, 0.792, 0.712, 0.815, 0.549, 0.837, 0.426, 0.318, 0.593, 0.102, 0.041, 0.413, 0.783, 0.524, 0.305, 0.614, 0.547, 0.221, 0.463, 0.856, 0.94, 0.392, 0.834, 0.405, 0.722, 0.29, 0.541, 0.173, 0.849, 0.235, 0.76, 0.199, 0.981, 0.038, 0.27, 0.662, 0.89, 0.665, 0.35, 0.539, 0.66, 0.688, 0.525, 0.354, 0.574, 0.395, 0.357, 0.009, 0.062, 0.702, 0.398, 0.949, 0.153, 0.518, 0.898, 0.496, 0.998, 0.821, 0.292, 0.741, 0.953, 0.471, 0.972, 0.789, 0.376, 0.986, 0.035, 0.741, 0.095, 0.881, 0.672, 0.973, 0.502, 0.147, 0.377, 0.457, 0.218, 0.291, 0.146, 0.604, 0.722, 0.177, 0.13, 0.181, 0.603, 0.613, 0.479, 0.345, 0.369, 0.574, 0.675, 0.754, 0.954, 0.004, 0.789, 0.393, 0.565, 0.9, 0.658, 0.369, 0.233, 0.542, 0.443, 0.549, 0.538, 0.457, 0.403, 0.576, 0.045, 0.833, 0.984, 0.949, 0.367, 0.82, 0.707, 0.14, 0.585, 0.084, 0.447, 0.465, 0.633, 0.029, 0.239, 0.277, 0.698, 0.117, 0.918, 0.295, 0.563, 0.818, 0.37, 0.97, 0.283, 0.411, 0.765, 0.297, 0.238, 0.263, 0.239, 0.461, 0.643, 0.972, 0.356, 0.644, 0.322, 0.356, 0.691, 0.815, 0.583, 0.124, 0.306, 0.553, 0.899, 0.652, 0.091, 0.215, 0.484, 0.808, 0.077, 0.655, 0.982, 0.429, 0.501, 0.747, 0.885, 0.253, 0.344, 0.241, 0.785, 0.104, 0.599, 0.73, 0.907, 0.155, 0.402, 0.222, 0.794, 0.362, 0.467, 0.758, 0.122, 0.099, 0.046, 0.848, 0.444, 0.357, 0.139, 0.245, 0.371, 0.126, 0.103, 0.226, 0.667, 0.757, 0.107, 0.058, 0.738, 0.824, 0.734, 0.811, 0.127, 0.139, 0.91, 0.721, 0.965, 0.63, 0.982, 0.081, 0.915, 0.586, 0.298, 0.69, 0.694, 0.946, 0.883, 0.745, 0.758, 0.26, 0.548, 0.859, 0.096, 0.748, 0.609, 0.39, 0.059, 0.958, 0.324, 0.541, 0.081, 0.264, 0.045, 0.142, 0.667, 0.701, 0.683, 0.999, 0.24, 0.985, 0.588, 0.823, 0.452, 0.785, 0.677, 0.902, 0.706, 0.889, 0.268, 0.515, 0.809, 0.7, 0.927, 0.269, 0.599, 0.204, 0.779, 0.13, 0.454, 0.017, 0.452, 0.593, 0.932, 0.185, 0.411, 0.531, 0.814, 0.965, 0.809, 0.109, 0.931, 0.94, 0.658, 0.823, 0.166, 0.205, 0.51, 0.416, 0.214, 0.972, 0.83, 0.12, 0.948, 0.131, 0.865, 0.109, 0.07, 0.286, 0.127, 0.747, 0.848, 0.224, 0.614, 0.029, 0.96, 0.098, 0.262, 0.648, 0.64, 0.207, 0.24, 0.779, 0.01, 0.68, 0.28, 0.343, 0.36, 0.652, 0.932, 0.203, 0.113, 0.778, 0.416, 0.262, 0.154, 0.443, 0.283, 0.43, 0.359, 0.086, 0.86, 0.128, 0.104, 0.997, 0.573, 0.25, 0.457, 0.237, 0.44, 0.69, 0.918, 0.809, 0.064, 0.935, 0.392, 0.837, 0.018, 0.845, 0.443, 0.1, 0.804, 0.664, 0.903, 0.829, 0.816, 0.555, 0.91, 0.918, 0.234, 0.479, 0.54, 0.556, 0.335, 0.417, 0.333, 0.898, 0.242, 0.6, 0.93, 0.196, 0.52, 0.559, 0.056, 0.475]'::vector))) AS relevance
// FROM 
//     magazines_optimized m
// JOIN 
//     magazine_content_optimized mc 
// ON 
//     m.id = mc.magazine_id
// WHERE 
//     to_tsvector('english', m.title) @@ plainto_tsquery('english', 'Focus miss debate')
//     OR to_tsvector('english', m.author) @@ plainto_tsquery('english', 'Focus miss debate')
//     OR to_tsvector('english', mc.content) @@ plainto_tsquery('english', 'Focus miss debate')
// ORDER BY 
//     relevance DESC
// LIMIT 10;
//     `;
// //     const sql = `
// // SELECT
// //     m.id AS magazine_id,
// //     m.title,
// //     m.author,
// //     mc.content,
// //     ts_rank_cd(
// //         to_tsvector('english', m.title) ||
// //         to_tsvector('english', m.author) ||
// //         to_tsvector('english', mc.content),
// //         plainto_tsquery('english', $1)
// //     ) AS keyword_rank
// // FROM
// //     magazines_optimized m
// // JOIN
// //     magazine_content_optimized mc ON m.id = mc.magazine_id
// // WHERE
// //     to_tsvector('english', m.title) @@ plainto_tsquery('english', $1) OR
// //     to_tsvector('english', m.author) @@ plainto_tsquery('english', $1) OR
// //     to_tsvector('english', mc.content) @@ plainto_tsquery('english', $1)
// // ORDER BY keyword_rank DESC
// // limit 10;
// //     `;

// //     const sql = `
// //     WITH KeywordSearch AS (
// //     SELECT
// //         m.id AS magazine_id,
// //         m.title,
// //         m.author,
// //         mc.content,
// //         ts_rank_cd(
// //             to_tsvector('english', m.title) ||
// //             to_tsvector('english', m.author) ||
// //             to_tsvector('english', mc.content),
// //             plainto_tsquery('english', $1)
// //         ) AS keyword_rank
// //     FROM
// //         magazines m
// //     JOIN
// //         magazine_content mc ON m.id = mc.magazine_id
// //     WHERE
// //         to_tsvector('english', m.title) @@ plainto_tsquery('english', $1) OR
// //         to_tsvector('english', m.author) @@ plainto_tsquery('english', $1) OR
// //         to_tsvector('english', mc.content) @@ plainto_tsquery('english', $1)
// // ),
// // VectorSearch AS (
// //     SELECT
// //         mc.magazine_id,
// //         1 - (mc.vector_representation <=> $2::vector) AS vector_rank
// //     FROM
// //         magazine_content mc
// //     ORDER BY
// //         vector_rank DESC
// //     LIMIT 10
// // )
// // SELECT
// //     ks.magazine_id AS id,
// //     ks.title,
// //     ks.author,
// //     ks.content,
// //     (ks.keyword_rank + vs.vector_rank) / 2 AS relevance
// // FROM
// //     KeywordSearch ks
// // JOIN
// //     VectorSearch vs ON ks.magazine_id = vs.magazine_id
// // ORDER BY
// //     relevance DESC
// // LIMIT 10;
// //     `;

//     const results = await db.any(sql, [query, vector]);
//     const endUnoptimized = Date.now();
//     const durationUnoptimized = endUnoptimized - startUnoptimized;

//     return {results: results, timeTaken: durationUnoptimized};

// }












