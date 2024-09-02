require('dotenv').config();  // Load environment variables from .env

module.exports = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
};
// module.exports = {
//     user: 'your_db_user',
//     host: 'localhost',
//     database: 'your_database',
//     password: 'your_db_password',
//     port: 5432,
// };