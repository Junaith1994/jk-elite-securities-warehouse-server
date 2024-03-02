const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// Using Middleware
app.use(cors());
// body parser
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Welcome to Jk Elite Securties Server")
})


app.listen(port, () => {
    console.log("Listening to port :", port);
})

// Export the Express API
module.exports = app;


// Note: In package.json > "main": "server.js" might be a problem