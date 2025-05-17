const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

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

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		await client.connect();

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
			const newUser = req.body;
			const result = await usersCollection.insertOne(newUser);
			res.send(result);
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
		await client.db("admin").command({ ping: 1 });
		console.log("Pinged your deployment. You successfully connected to MongoDB!");
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

app.listen(port, function () {
	console.log("CORS-enabled web server listening on port ", port);
});
