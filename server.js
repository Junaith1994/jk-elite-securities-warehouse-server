const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const moment = require('moment'); // For Date and Time
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
            const productId = req.body.productId;
            const updatedQtyValue = req.body.updatedValue;
            const deliveredValue = req.body.deliveredValue;
            // console.log(updatedQtyValue, deliveredValue, productId);
            const filter = { _id: new ObjectId(productId) };
            const updateDoc = {
                $set: {
                    quantity: updatedQtyValue,
                    delivered: deliveredValue
                },
            }
            const result = await productsCollection.updateMany(filter, updateDoc, { ignoreUndefined: true });
            res.send(result);
        })

        // Clearing Delivered-Quantity Data
        app.post('/product/clear-delivered', async (req, res) => {
            const productId = req.body.productId;
            const deleveredValue = 0;
            const filter = { _id: new ObjectId(productId) };
            const updateDoc = {
                $set: {
                    delivered: deleveredValue
                }
            }

            const result = await productsCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // Add product info
        app.post('/product/add-product', async (req, res) => {
            const productInfo = req.body.productInfo;
            // Date Conversion to get accurate local date and time and set as Date in database
            const dateString = moment().format('YYYY-MM-DDTHH:mm:ss.SSS');
            const date = new Date(dateString);
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() + (offset * -60000));
            // Setting insertion date in database
            productInfo.date = localDate;
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

        // Getting products by specific Email
        app.get('/my-items/:email', async (req, res) => {
            const userEmail = req.params.email;
            // console.log('userEmail:', userEmail);
            const query = { createdBy: userEmail };
            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // Getting Recently Added Products 
        app.get('/recently-added', async (req, res) => {
            const last7DaysData = moment().subtract(7, 'days').toDate();
            const cursor = productsCollection.aggregate([
                {
                    $match: {
                        date: { $gte: last7DaysData }
                    }
                }
            ]);
            const result = await cursor.toArray();
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