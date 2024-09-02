### Backend Setup

The backend has been hosted over Vercel, so no setup is required by the user.




### Backend Hosting and Setup

The backend has been hosted on Vercel, so no setup is required by the user. You can directly interact with the API using the provided endpoint.

#### Backend Details
- **Platform**: Vercel
- **Technologies Used**: Node.js, Express.js

#### API Endpoint
You can access the API via the following endpoint:

**Endpoint:**
[https://hybrid-search-backend.vercel.app/api/elastic-search](https://hybrid-search-backend.vercel.app/api/elastic-search)

Request:
To perform a search using both a keyword query and a 1563-dimension vector, send a POST request to the endpoint with the following JSON payload:

### Request

To perform a search using both a keyword query and a 1563-dimension vector, send a `POST` request to the endpoint with the following JSON payload:

```json
{
    "query": "example search keyword",
    "vector": [0.376, 0.957, …, 0.396]  // 1563-dimension vector
}
```

### Request

To perform a search using both a keyword query and a 1563-dimension vector, send a `POST` request to the endpoint with the following JSON payload:

The API responds with a JSON object containing search results, including the id, title, author, content, and relevance score for each result. Additionally, it includes the timeTaken field, which indicates the time taken by the server to process the request (in milliseconds).
```json
{
    "results": [
        {
            "id": "2328",
            "title": "Example example situation director seven news.",
            "author": "Pamela Farrell",
            "content": [
                "Choose investment bad result recently total others not. Window by respond ready understand. Since hit five task yard student ready perhaps. Job investment girl the. Prevent finally step.",
                "Former indeed pattern people since change. American group war. He first since what significant. Answer employee majority particularly season none. Appear college campaign letter."
            ],
            "relevance": 0.04761905  // score for the search
        }
        // Additional results...
    ],
    "timeTaken": 14  // Time taken in milliseconds
}
```
