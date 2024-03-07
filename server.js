const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
// console.log(process.env);
// Using Middleware
app.use(cors());
// body parser
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Welcome to Jk Elite Securties Server")
})

// MongoDb Connection string
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.yiwwnew.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const mongoClientConnect = async () => {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
}
mongoClientConnect();

async function run() {
    try {
        // All Security products from database
        const productsCollection = client.db("jk-elite-securities-warehouse").collection("products");

        // Getting all products
        app.get('/products', async (req, res) => {
            // console.log('Request from client:', req);
            const query = {};
            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // Getting Individual product by id
        app.get('/product/:id', async (req, res) => {
            const productId = req.params.id;
            const query = { _id: new ObjectId(productId) };
            const product = await productsCollection.findOne(query);
            res.send(product);
        })

        // Update Product Quantity
        app.post('/product/update-qty', async (req, res) => {
            const updatedQtyValue = req.body.updatedValue;
            const productId = req.body.productId;
            console.log(updatedQtyValue, productId);
            const filter = { _id: new ObjectId(productId) };
            const updateQty = {
                $set: {
                    quantity: updatedQtyValue
                }
            }
            const result = await productsCollection.updateOne(filter, updateQty)
            res.send(result);
        })

        // Add product info
        app.post('/product/add-product', async (req, res) => {
            const productInfo = req.body.productInfo;
            console.log(productInfo);
            const result = await productsCollection.insertOne(productInfo);
            res.send(result);
        })

        // Delete product
        app.delete('/product/delete/:id', async (req, res) => {
            const productId = req.params.id;
            const query = { _id: new ObjectId(productId) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log("Listening to port :", port);
})

// Export the Express API
module.exports = app;


// Note: In package.json > "main": "server.js" might be a problem