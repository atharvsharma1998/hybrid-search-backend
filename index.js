// const app = require('./src/app');

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });


const app = require('./src/app');

// No need to listen on a port in a serverless environment
module.exports = app;