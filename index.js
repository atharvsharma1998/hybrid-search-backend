// const app = require('./src/app');
// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

/**
 * Entry point for the application.
 * 
 * This file exports the Express application to be used as a serverless function
 * by the Vercel platform. Since this application is running in a serverless environment,
 * there is no need to listen on a specific port.
 */


const app = require('./src/app');

// No need to listen on a port in a serverless environment
module.exports = app;