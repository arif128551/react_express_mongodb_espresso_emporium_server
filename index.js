require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

var admin = require("firebase-admin");

var serviceAccount = require("./mern-espresso-emporium-client-firebase-adminsdk-fbsvc-1e299091af.json");

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
	});
}

var express = require("express");
var cors = require("cors");
var app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x7tmnab.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		// await client.connect();

		const coffeesDatabase = client.db("coffeeDB");
		const coffeesCollection = coffeesDatabase.collection("coffees");
		const usersCollection = coffeesDatabase.collection("users");

		app.get("/coffees", async (req, res) => {
			const result = await coffeesCollection.find().toArray();
			res.send(result);
		});

		app.get("/coffees/:id", async (req, res) => {
			const id = req.params.id;
			const query = {
				_id: new ObjectId(id),
			};
			const result = await coffeesCollection.findOne(query);
			res.send(result);
		});

		app.post("/coffees", async (req, res) => {
			const newCoffee = req.body;
			const result = await coffeesCollection.insertOne(newCoffee);
			res.send(result);
		});

		app.put("/coffees/:id", async (req, res) => {
			const id = req.params.id;
			const filter = {
				_id: new ObjectId(id),
			};

			const updatedCoffee = req.body;
			const updateDoc = {
				$set: updatedCoffee,
			};
			const options = { upsert: true };
			const result = await coffeesCollection.updateOne(filter, updateDoc, options);
			res.send(result);
		});

		app.delete("/coffees/:id", async (req, res) => {
			const id = req.params.id;
			const query = {
				_id: new ObjectId(id),
			};
			const result = await coffeesCollection.deleteOne(query);
			res.send(result);
		});

		app.get("/users", async (req, res) => {
			const result = await usersCollection.find().toArray();
			res.send(result);
		});

		app.post("/users", async (req, res) => {
			const { email } = req.body;

			if (!email) {
				return res.status(400).send({ error: true, message: "Email is required" });
			}

			const existingUser = await usersCollection.findOne({ email });

			if (existingUser) {
				return res.status(200).send({ status: "existing" });
			}

			const result = await usersCollection.insertOne(req.body);

			res.status(201).send({
				status: "new",
				insertedId: result.insertedId,
			});
		});

		app.get("/users/:id", async (req, res) => {
			const id = req.params.id;
			const query = {
				_id: new ObjectId(id),
			};
			const result = await usersCollection.findOne(query);
			res.send(result);
		});

		app.patch("/users/update/:id", async (req, res) => {
			const id = req.params.id;

			const filter = { _id: new ObjectId(id) };
			const updateDoc = { $set: req.body };

			const result = await usersCollection.updateOne(filter, updateDoc);

			res.send(result);
		});

		app.patch("/users", async (req, res) => {
			const { email, lastSignInTime } = req.body;

			if (!email || !lastSignInTime) {
				return res.status(400).send({ error: true, message: "Email and lastSignInTime required" });
			}

			const filter = { email };
			const updateDoc = { $set: { lastSignInTime } };

			const result = await usersCollection.updateOne(filter, updateDoc);

			if (result.modifiedCount === 0) {
				return res.status(404).send({ message: "User not found or time already same" });
			}

			res.send({ message: "Last sign-in time updated", modifiedCount: result.modifiedCount });
		});

		app.delete("/users/:id", async (req, res) => {
			const id = req.params.id;
			const query = {
				_id: new ObjectId(id),
			};
			const result = await usersCollection.deleteOne(query);
			res.send(result);
		});

		app.delete("/firebase-users", async (req, res) => {
			const { email } = req.body;

			if (!email) {
				return res.status(400).json({ success: false, message: "Email is required." });
			}

			try {
				const userRecord = await admin.auth().getUserByEmail(email);
				await admin.auth().deleteUser(userRecord.uid);
				console.log("Firebase user deleted:", email);
				res.status(200).json({ success: true, message: `Firebase user deleted: ${email}` });
			} catch (error) {
				console.error("Error deleting Firebase user:", error);
				res.status(500).json({ success: false, message: error.message });
			}
		});

		// Send a ping to confirm a successful connection
		// await client.db("admin").command({ ping: 1 });
		// console.log("Pinged your deployment. You successfully connected to MongoDB!");
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("Server is live and working!");
});

// app.listen(port, function () {
// 	console.log("CORS-enabled web server listening on port ", port);
// });

module.exports = app;
