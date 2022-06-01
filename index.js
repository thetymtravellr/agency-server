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
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k5a62mv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const adminCollection = client.db("agency").collection("admin");
    const orderCollection = client.db("agency").collection("orders");
    const worksCollection = client.db("agency").collection("works");

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
    const feedbackCollection = client
      .db(process.env.DB_NAME)
      .collection("feedbacks");

    //  api to get all feedbacks
    app.get("/getFeedbacks", (req, res) => {
      feedbackCollection.find({}).toArray((err, feedbacks) => {
        res.status(200).send(feedbacks);
      });
    });

    //api to add feedback to database
    app.post("/addFeedback", (req, res) => {
      const feedback = req.body;
      feedbackCollection.insertOne(feedback).then((result) => {
        if (result.insertedCount > 0) {
          res.status(200).send(result.insertedCount > 0);
        } else {
          res.statusCode(400);
        }
      });
    });

    //------------------------- Orders database collection

    // api to add order

    app.post("/addOrder", (req, res) => {
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

      orderCollection.insertOne(order).then((result) => {
        if (result.insertedCount > 0) {
          res.status(200).send(result.insertedCount > 0);
        } else {
          res.sendStatus(400);
        }
      });
    });

    // api to get all order

    app.get("/getOrders", (req, res) => {
      const queryEmail = req.query.email;
      let filterObject = { email: queryEmail };
      const projectObject = {};
      if (!queryEmail) {
        filterObject = {};
        projectObject.image = 0;
      }

      const result = orderCollection
        .find(filterObject)
        .project(projectObject)
        .toArray();
      if (result.length > 0) {
        res.status(200).send(orders);
      } else {
        res.sendStatus(400);
      }
    });

    // app.get("/getOrders", (req, res) => {
    //   const queryEmail = req.query.email;
    //   let filterObject = { email: queryEmail };
    //   const projectObject = {};
    //   if (!queryEmail) {
    //     filterObject = {};
    //     projectObject.image = 0;
    //   }

    //   orderCollection
    //     .find(filterObject)
    //     .project(projectObject)
    //     .toArray((err, orders) => {
    //       if (orders.length > 0) {
    //         res.status(200).send(orders);
    //       } else {
    //         res.sendStatus(400);
    //       }
    //     });
    // });

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

    // app.patch("/updateOrderStatus", (req, res) => {
    //   const orderId = req.body.id;
    //   const status = req.body.status;
    //   orderCollection
    //     .updateOne({ _id: ObjectId(orderId) }, { $set: { status: status } })
    //     .then((result) => {
    //       if (result.modifiedCount) {
    //         res.status(200).send(result.modifiedCount > 0);
    //       } else {
    //         res.sendStatus(400);
    //       }
    //     });
    // });

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

    // app.delete("/cancelOrder/:id", (req, res) => {
    //   const id = req.params.id;
    //   orderCollection.deleteOne({ _id: ObjectId(id) }).then((result) => {
    //     if (result.deletedCount > 0) {
    //       res.status(200).send(result.deletedCount > 0);
    //     } else {
    //       res.sendStatus(400);
    //     }
    //   });
    // });

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
      // adminCollection.insertOne(req.body).then((result) => {
      //   if (result.insertedCount > 0) {
      //     res.status(200).send(result.insertedCount > 0);
      //   } else {
      //     res.sendStatus(400);
      //   }
      // });
    });

    app.get("/getAdmins", async (req, res) => {
      const query = {};
      const result = await adminCollection.find(query);
      res.send(result);
      // adminCollection.find({}).toArray((err, admins) => {
      //   if (admins.length > 0) {
      //     res.status(200).send(admins);
      //   } else {
      //     res.sendStatus(400);
      //   }
      // });
    });
  } finally {
  }
}

run().catch(console.dir)

// connecting to database
// client.connect((err) => {
//   // ---------------------------------Services database collection
//   const serviceCollection = client
//     .db(process.env.DB_NAME)
//     .collection("services");
//   // perform actions on the collection object
//   console.log("database connection established");
// });

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});


// DB_USER=db_user
// DB_PASS=hR1yhQ9LDl5vXzZM