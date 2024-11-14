const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config();

//middleware 
app.use(cors());
app.use(express.json());

//Gym-Genesis   ,   pMuYuFgPNv8jxcg2 

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.i1uhr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
   
    // create database 
    const database = client.db("Gym-Genesis");
    const  usersCollection = database.collection("users");
    const  classesCollection = database.collection("classes");
    const  cartCollection = database.collection("cart");
    const  paymentCollection = database.collection("payment");
    const  enrolledCollection = database.collection("enrolled");
    const  appliedCollection = database.collection("applied");
    

    app.post('/new-class', async (req, res) => {
        const newClass = req.body;
        const result = await classesCollection.insertOne(newClass);
        res.send(result);
     })

    app.get('/classes', async (req, res) => {
        const query = {status : 'approved'};  
        const result = await classesCollection.find().toArray();  // please check 
        res.send(result);
    })

    // get classes by instructor email address 
    app.get('/classes/:email', async (req,res) => {
        const email = req.params.email;
        const query = {instructorEmail: email};
        const result = await classesCollection.find(query).toArray();
        res.send(result);
    })

    // manage classes 
    app.get('/classes-manage', async (req, res) => {
        const result = await classesCollection.find().toArray();
        res.send(result);
    })

    // updated classes status and reasons 
    app.patch('/change-status/:id', async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const reason = req.body.reason;
      const filter = {_id: new ObjectId(id)};
      const options = { upsert: true };
      const updateDoc = {
        $set: {
         status : status,
         reasons : reason,
        },
      };
      const result = await classesCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    // get approved classes 
    app.get('/approved-classes', async(req, res) =>{
      const query = { status : 'approved'};
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    })

    // get single class details 
    app.get('/class/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await classesCollection.findOne(query);
      res.send(result);
    })
                                                      
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Gym-Genesis server is Running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})