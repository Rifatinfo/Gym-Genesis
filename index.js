const express = require('express')
var cors = require('cors')
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config();

//middleware 
app.use(cors());
app.use(express.json());

//Gym-Genesis   ,   pMuYuFgPNv8jxcg2 

//middleware for admin and instructor 
const verifyAdmin = async (req, res, next) =>{
  const email = req.decoded.email;
  const query = {email : email};
  const user = await usersCollection.findOne(query);
  if(user.role === 'admin'){
     next();
  }
  else{
    return res.status(401).send({message: 'Forbidden access'});
  }
}
const verifyInstructor = async (req, res, next) =>{
  const email = req.decoded.email;
  const query = {email : email};
  const user = await usersCollection.findOne(query);
  if(user.role === 'instructor'){
     next();
  }
  else{
    return res.status(401).send({message: 'Forbidden access'});
  }
}


// verify token 
const verifyJWT = (req, res, next) =>{
  const authorization = req.header.authorization;
  if(!authorization){
    return res.status(401).send({message: 'Invalid authorization'});
  }

  const token = authorization?.split(' ')[1];
  jwt.verify(token, process.env.ASSESS_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({message: 'IForbidden access'});
    }
    req.decoded = decoded;
    next();
  });
}


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
    const usersCollection = database.collection("users");
    const classesCollection = database.collection("classes");
    const cartCollection = database.collection("cart");
    const enrolledCollection = database.collection("enrolled");
    const appliedCollection = database.collection("applied");
    
    // routes for users
    app.post('/new-user', verifyJWT, async (req, res) => {
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    app.post('/api/set-token', verifyJWT, async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ASSESS_SECRET, {
        expiresIn: '24h' 
      });
      res.send({token})
    })

    app.get('/users', verifyJWT, async (req, res) => {
      const result = await usersCollection.find({}).toArray();
      res.send(result);
    })

    app.get('/users/:id',  verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await usersCollection.findOne(query);
      res.send(result);
    })

    app.get('/user/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = {email : email};
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.delete('/delete-user/:id', verifyJWT, verifyAdmin, async (req, res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.put('/update-user/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      const filter = {_id : new ObjectId(id)};
      const options = {upsert : true};
      const updateDoc = {
        name : updatedUser.name,
        email : updatedUser.email,
        role : updatedUser.option,
        address : updatedUser.address,
        about : updatedUser.about,
        photoUrl : updatedUser.photoUrl,
        skills : updatedUser.skills ? updatedUser.skills : null,
      }

      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    app.post('/new-class', verifyJWT, async (req, res) => {
      const newClass = req.body;
      const result = await classesCollection.insertOne(newClass);
      res.send(result);
    })

    app.get('/classes', verifyJWT, verifyAdmin, async (req, res) => {
      const query = { status: 'approved' };
      const result = await classesCollection.find().toArray();  // please check 
      res.send(result);
    })

    // get classes by instructor email address 
    app.get('/classes/:email', verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const query = { instructorEmail: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    })

    // manage classes 
    app.get('/classes-manage', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    })

    // updated classes status and reasons 
    app.patch('/change-status/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const reason = req.body.reason;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: status,
          reasons: reason,
        },
      };
      const result = await classesCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    // get approved classes 
    app.get('/approved-classes', verifyJWT, verifyAdmin, async (req, res) => {
      const query = { status: 'approved' };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    })

    // get single class details 
    app.get('/class/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.findOne(query);
      res.send(result);
    })

    // update class details (all data)
    app.put('/update-class/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const updateClass = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updateClass.name,
          description: updateClass.description,
          price: updateClass.price,
          availableSeats: parseInt(updateClass.availableSeats),
          videoLink: updateClass.videoLink,
          status: 'pending',
        }
      }
      const result = await classesCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    // cart Routes 
    app.post('/add-to-cart', verifyJWT, verifyInstructor, async (req, res) => {
      const newCartItem = req.body;
      const result = await cartCollection.insertOne(newCartItem);
      res.send(result);
    });

    // get cart item by id 
    app.get('/cart-item/:id', verifyJWT, verifyInstructor, async (req, res) => {
      const id = req.params.id;
      const email = req.body.email;
      const query = {
        classId: id,
        userMail: email,
      };
      const projection = { classId: 1 };
      const result = await cartCollection.findOne(query, { projection: projection });
      res.send(result);
    });

    // cart info by user email 
    app.get('/cart/:email', verifyJWT, verifyInstructor, async (req, res) => {
      const email = req.params.email;
      const query = { userMail: email };
      const projection = { classId: 1 };
      const carts = await cartCollection.find(query, { projection: projection });
      const classIds = carts.map(cart => new ObjectId(cart.classId));
      const query2 = { _id: { $in: classIds } }
      const result = classesCollection.find(query2).toArray();
      res.send(result);
    });

    // delete cart item 
    app.delete('/delete-cart-item/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { classId: id };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })

    // enrolled Routes 
    app.get('/popular-classes', verifyJWT, async (req, res) => {
      const result = classesCollection.find().sort({ totalEnrolled: -1 }).limit(6).toArray();
      res.send(result);
    })

    app.get('/popular-instructor', verifyJWT, async (req, res) => {
      const pipeline = [
        {
          $group: {
            _id: $instructorEmail,
            totalEnrolled: { $sum: "$totalEnrolled" }
          }
        },
        {
          $lookup: {
            from: "users",
            localFiled: "_id",
            foreignFiled: "email",
            as: "instructor",
          }
        },
        {
           $projects : {
            _id : 0,
            instructor : {
              $arrayElemAt : ["$instructor ", 0]
            },
            totalEnrolled : 1
           }
        },
        {
          $sort : {
            totalEnrolled : -1
          }
        },
        {
          $limit : 6,
        },
      ];
      const result = classesCollection.aggregate(pipeline).toArray(); 
      res.send(result);
    });

    // admin - status 
    app.get('/admin-status', verifyJWT, async (req, res) => {
      const approvedClasses = (await classesCollection.find({status : 'approved'}).toArray()).length; 
      const pendingClasses = (await classesCollection.find({status : 'pending'}).toArray()).length;
      const instructor = (await usersCollection.find({role : 'instructor'})).toArray().length; 
      const totalClasses = (await classesCollection.find().toArray()).length;
      const totalEnrolled = (await enrolledCollection.find()).toArray().length;

      const result = {
        approvedClasses,
        pendingClasses,
        instructor,
        totalClasses,
        totalEnrolled
      };
      res.send(result);
    });

    // get all Instructor 
    app.get('/instructor', verifyJWT, verifyInstructor, async (req, res) => {
      const result = await usersCollection.find({role : 'instructor'}).toArray();
      res.send(result);
    })

    app.get('/enrolled-classes/:email', verifyInstructor, verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail : email};
      const pipeline = [
        {
          $match : query
        },
        {
          $lookup : {
            from : "classes",
            localFiled : "classId",
            foreignFiled : "_id",
            as : "class"
          }
        },
        {
          $unwind : "$classes"
        },
        {
          $lookup : {
            from : "users",
            localFiled : "classes.instructorEmail",
            foreignFiled : "email",
            as : "instructor"
          }
        },
        {
          $projects : {
            _id : 0,
            instructor : {
              $arrayElemAt : ["$instructor ", 0]
            },
            classes : 1
           }
        }
      ];

      const result = await enrolledCollection.aggregate(pipeline).toArray();
      res.send(result);
    })

    // applied for instructor 
    app.post('/ass-instructor',  verifyAdmin, verifyJWT, async (req, res) => {
      const data = req.body;
      const result = await appliedCollection.insertOne(data);
      res.send(result);
    })

    app.get('/applied-instructor', verifyJWT,  verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const result = await appliedCollection.findOne({email});
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