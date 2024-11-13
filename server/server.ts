import express from "express";
import { MongoClient, ObjectId } from "mongodb";
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
      const { category, place, startTime, endTime, search } = req.query;
      const query: any = {};

      if (category) query.category = category;
      if (place) query.place = place;
      if (startTime || endTime) {
        query.date = {};
        if (startTime) query.date.$gte = new Date(startTime as string);
        if (endTime) query.date.$lte = new Date(endTime as string);
      }
      if (search) query.title = { $regex: search, $options: "i" };

      try {
        const events = await eventsCollection.find(query).toArray();
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

    app.post("/api/join/:eventId", async (req, res) => {
      const { eventId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const usersCollection = db.collection("users");

        // Add the event ID to the user's joined events if not already present
        const result = await usersCollection.updateOne(
          { userId: new ObjectId(userId) }, // Match based on userId
          { $addToSet: { joinedEvents: new ObjectId(eventId) } },
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .json({ message: "User not found or already joined" });
        }

        res.status(200).json({ message: "Successfully joined the event!" });
      } catch (error) {
        console.error("Error joining event:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.get("/api/user/events/:userId", async (req, res) => {
      const { userId } = req.params;

      try {
        const usersCollection = db.collection("users");
        const eventsCollection = db.collection("eventdb");

        const user = await usersCollection.findOne({
          userId: new ObjectId(userId),
        });
        if (!user || !user.joinedEvents) {
          return res.json([]); // Return empty if no joined events
        }

        // Retrieve the events corresponding to the event IDs in joinedEvents
        const events = await eventsCollection
          .find({ _id: { $in: user.joinedEvents } })
          .toArray();

        res.json(events);
      } catch (error) {
        console.error("Error fetching user events:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    async function joinEvent(userId: string, eventId: string) {
      try {
        const usersCollection = db.collection("users");
        const eventsCollection = db.collection("eventdb");

        // Add the eventId to the user's list of joined events
        await usersCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $addToSet: { joinedEvents: new ObjectId(eventId) } },
        );

        // Add the userId to the event's list of participants
        await eventsCollection.updateOne(
          { _id: new ObjectId(eventId) },
          { $addToSet: { participants: new ObjectId(userId) } },
        );
      } catch (error) {
        console.error("Error in joinEvent function:", error);
        throw error; // Re-throw the error to be caught by the route handler
      }
    }

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
