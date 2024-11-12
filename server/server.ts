import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(
  process.env.MONGODB_URI ||
    "mongodb+srv://simonnbnilsen:59eFeYz3YtZu70cb@cluster0.18lyj.mongodb.net/",
);

client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");

    const db = client.db("eventdb");
    const eventsCollection = db.collection("eventdb");

    app.get("/api/event", async (req, res) => {
      try {
        const events = await eventsCollection.find().toArray(); // Get all events
        res.json(events);
      } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.post("/api/event", async (req, res) => {
      const newEvent = req.body;
      try {
        const result = await eventsCollection.insertOne(newEvent);
        newEvent._id = result.insertedId;
        res.status(201).json(newEvent);
      } catch (error) {
        console.error("Error saving event:", error);
        res.status(400).json({ message: "Error saving event" });
      }
    });

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
