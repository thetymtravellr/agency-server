const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Mongodb
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://db_user1:${process.env.DB_PASS}@cluster0.k5a62mv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);
async function run() {
  try {

    await client.connect();
    const adminCollection = client.db("agency").collection("admin");
    const orderCollection = client.db("agency").collection("orders");
    const worksCollection = client.db("agency").collection("works");
    const serviceCollection = client.db("agency").collection("services");
    const feedbackCollection = client.db("agency").collection("feedbacks");

    // api to get all service
    app.get("/getServices", (req, res) => {
      serviceCollection.find({}).toArray((err, services) => {
        res.status(200).send(services);
      });
    });

    //api to add service to database
    app.post("/addService", (req, res) => {
      const data = req.body;
      const file = req.files.file;
      const newImg = file.data;
      const encImg = newImg.toString("base64");

      var image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, "base64"),
      };
      const service = { ...data, image };
      serviceCollection.insertOne(service).then((result) => {
        if (result.insertedCount > 0) {
          res.status(200).send(result.insertedCount > 0);
        } else {
          res.statusCode(400);
        }
      });
    });

    //------------------------------ Works database collection

    // api to get all works
    app.get("/getWorks", (req, res) => {
      worksCollection
        .find({})
        .project({ _id: 1, image: 1 })
        .toArray((err, works) => {
          res.status(200).send(works);
        });
    });

    //---------------------- Feedback database collection

    //  api to get all feedbacks
    app.get("/getFeedbacks", async (req, res) => {
      const result = await feedbackCollection.find({}).toArray();
      res.send(result)
    });

    //api to add feedback to database
    app.post("/addFeedback", async (req, res) => {
      const feedback = req.body;
      const result = await feedbackCollection.insertOne(feedback)
      res.send(result)
    });

    //------------------------- Orders database collection

    // api to add order

    app.post("/addOrder", async (req, res) => {
      const data = req.body;
      const file = req.files.file;
      const newImg = file.data;
      const encImg = newImg.toString("base64");
      var image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, "base64"),
      };
      const order = { ...data, image };
      const result = await orderCollection.insertOne(order)
      res.send(result)
      });

    // api to get all order

    app.get("/getOrders", async (req, res) => {
      let query;
      if(req.query.email){
        const queryEmail = req.query.email;
        query = { email: queryEmail };
      } else {
        query = {}
      }
      const result = await orderCollection.find(query).toArray();
      res.send(result)
    });

    // api to update order

    app.patch("/updateOrderStatus", (req, res) => {
      const orderId = req.body.id;
      const status = req.body.status;
      const result = orderCollection.updateOne(
        { _id: ObjectId(orderId) },
        { $set: { status: status } }
      );
      if (result.modifiedCount) {
        res.status(200).send(result.modifiedCount > 0);
      } else {
        res.sendStatus(400);
      }
    });

    // api to delete order

    app.delete("/cancelOrder/:id", async (req, res) => {
      const id = req.params.id;
      const result = await orderCollection.deleteOne({ _id: ObjectId(id) });
      if (result.deletedCount > 0) {
        res.status(200).send(result.deletedCount > 0);
      } else {
        res.sendStatus(400);
      }
    });


    // api to search text from add records
    app.get("/searchInOrder", async (req, res) => {
      const searchText = req.query.searchTxt;
      const result = await orderCollection
        .find({ email: { $regex: searchText } })
        .project({ image: 0 })
        .toArray();
      if (result) {
        res.status(200).send(result);
      } else {
        res.sendStatus(404);
      }
    });

    //------------------------- Admin database collection
    app.post("/addAdmin", async (req, res) => {
      const admin = req.body;
      const result = await adminCollection.insertOne(admin);
      res.send(result);
    });

    app.get("/getAdmins", async (req, res) => {
      const query = {};
      const result = await adminCollection.find(query).toArray();
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir)

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
