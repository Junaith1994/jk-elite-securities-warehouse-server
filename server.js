const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const moment = require('moment'); // For Date and Time
const app = express();
const port = process.env.PORT || 5000;

// Using Middleware
app.use(cors());
// body parser
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Welcome to Jk Elite Securties Server")
})

// Generating Access Token
const generateAccessToken = userEmail => {
    return jwt.sign({ userEmail }, process.env.SECRET_TOKEN, { expiresIn: '10h' });
}

// Sending Access Token to the requested URL(to the new user)
app.post('/createNewUser', async (req, res) => {
    const userEmail = await req.body.email;
    const token = userEmail && generateAccessToken(userEmail);
    res.send(token);
})

// Verify JWT token from client
function verryfyJwtToken(req, res, next) {
    const authHeader = req.headers;
    const token = authHeader && authHeader?.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).send({ title: "Unauthorized Access" });
    }

    jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
        if (err) {
            return res.status(403).send({ title: "Forbidden Access" })
        }
        req.user = user;
        next()
    })
}

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
            productInfo.date = new Date();
            // Adding delevered Qty info into productInfo
            productInfo.delivered = 0;
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
        app.get('/my-items/:email', verryfyJwtToken, async (req, res) => {
            const userEmail = req.params.email;
            const verifiedEmail = req?.user?.userEmail;
            
            if (userEmail === verifiedEmail) {
                const query = { createdBy: userEmail };
                const cursor = productsCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }
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