import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const ENTRAID_CLIENT_ID = process.env.ENTRAID_CLIENT_ID;
const ENTRAID_CLIENT_SECRET = process.env.ENTRAID_CLIENT_SECRET;

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

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
        const existingEvent = await eventsCollection.findOne({
          title: newEvent.title,
        });
        if (existingEvent) {
          return res
            .status(400)
            .json({ message: "Event with the same title already exists" });
        }

        const result = await eventsCollection.insertOne(newEvent);
        newEvent._id = result.insertedId;
        res.status(201).json(newEvent);
      } catch (error) {
        console.error("Error saving event:", error);
        res.status(400).json({ message: "Error saving event" });
      }
    });

    app.get("/api/event/:eventTitle", async (req, res) => {
      const { eventTitle } = req.params;

      try {
        const event = await eventsCollection.findOne({ title: eventTitle });
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        const organizer = await db
          .collection("users")
          .findOne({ _id: new ObjectId(event.organizerId) });
        if (!organizer) {
          return res.status(404).json({ message: "Organizer not found" });
        }

        const eventDetails = {
          title: event.title,
          description: event.description,
          time: event.date,
          place: event.place,
          organizerName: organizer.name,
          organizerPhoto: organizer.photo,
        };

        res.json(eventDetails);
      } catch (error) {
        console.error("Error fetching event details:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.post("/api/join/:eventTitle", async (req, res) => {
      const { eventTitle } = req.params;
      const { userId } = req.body;

      if (!userId) {
        console.error("Invalid or missing userId:", userId); // Debugging log
        return res.status(400).json({ message: "Invalid or missing userId" });
      }

      try {
        const usersCollection = db.collection("users");
        const eventsCollection = db.collection("eventdb");

        // Check if the event exists
        const event = await eventsCollection.findOne({ title: eventTitle });
        if (!event) {
          console.error("Event not found:", eventTitle); // Debugging log
          return res.status(404).json({ message: "Event not found" });
        }

        // Add the event to the user's joinedEvents
        const result = await usersCollection.updateOne(
          { _id: userId }, // Use the string `userId` directly
          { $addToSet: { joinedEvents: event._id } }, // Add event._id to joinedEvents array
          { upsert: true }, // Create the user if it doesn't exist
        );

        if (result.modifiedCount === 0 && result.upsertedCount === 0) {
          return res.status(400).json({ message: "Event already joined" });
        }

        res.status(200).json({ message: "Successfully joined the event!" });
      } catch (error) {
        console.error("Error joining event:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.get("/api/user/events/:userId", async (req, res) => {
      const { userId } = req.params;

      // Validate userId
      if (!userId || !ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
      }

      try {
        const usersCollection = db.collection("users");
        const eventsCollection = db.collection("eventdb");

        // Find user and their joined events
        const user = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });
        if (!user || !user.joinedEvents || user.joinedEvents.length === 0) {
          return res.json([]); // Return empty if no joined events
        }

        // Fetch events by IDs
        const events = await eventsCollection
          .find({ _id: { $in: user.joinedEvents } })
          .toArray();
        res.json(events);
      } catch (error) {
        console.error(
          `Error fetching user events: userId=${userId}, error=${error}`,
        );
        res.status(500).json({
          message: "Failed to fetch user events. Please try again later.",
        });
      }
    });

    app.get("/api/user/events/:userId", async (req, res) => {
      const { userId } = req.params;

      try {
        const usersCollection = db.collection("users");
        const eventsCollection = db.collection("eventdb");

        const user = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });
        if (!user || !user.joinedEvents) {
          return res.json([]); // Return empty if no joined events
        }

        const events = await eventsCollection
          .find({ _id: { $in: user.joinedEvents } })
          .toArray();
        res.json(events);
      } catch (error) {
        console.error("Error fetching user events:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.put("/api/event/name/:eventName", async (req, res) => {
      const { eventName } = req.params;
      const updatedEvent = req.body;

      try {
        const result = await eventsCollection.updateOne(
          { title: eventName },
          { $set: updatedEvent },
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .json({ message: "Event not found or no changes made" });
        }

        res.status(200).json({ message: "Event updated successfully" });
      } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.delete("/api/event/name/:eventName", async (req, res) => {
      const { eventName } = req.params;
      console.log("Attempting to delete event with name:", eventName);

      try {
        const result = await eventsCollection.deleteOne({ title: eventName });
        console.log("Delete result:", result);

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Event not found" });
        }

        res.status(200).json({ message: "Event deleted successfully" });
      } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.get("/api/userinfo", async (req, res) => {
      const { access_token, discovery_endpoint } = req.cookies;

      if (access_token) {
        const configuration = await fetch(discovery_endpoint);
        const { userinfo_endpoint } = await configuration.json();

        const userinfoRes = await fetch(userinfo_endpoint, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        const userinfo = await userinfoRes.json();
        if (userinfoRes.ok) {
          // Map `sub` to `id` for consistency with frontend expectations
          const user = {
            id: userinfo.sub, // Map sub to id
            name: userinfo.name,
            email: userinfo.email,
            picture: userinfo.picture,
            ...userinfo,
          };
          return res.status(200).json(user);
        }
        return res.status(userinfoRes.status).json(userinfo);
      }

      res.sendStatus(401);
    });

    app.post("/api/login", (req, res) => {
      const { access_token, discovery_endpoint } = req.body;
      res.cookie("access_token", access_token);
      res.cookie("discovery_endpoint", discovery_endpoint);
      res.sendStatus(201);
    });

    app.get("/api/login/end_session", async (req, res) => {
      res.clearCookie("access_token");
      res.clearCookie("discovery_endpoint");
      res.redirect("/");
    });

    app.get("/api/login/entraid/start", async (req, res) => {
      const discovery_endpoint =
        "https://login.microsoftonline.com/organizations/v2.0/.well-known/openid-configuration";
      const client_id = ENTRAID_CLIENT_ID || "";
      if (!client_id) {
        console.error("ENTRAID_CLIENT_ID is not defined");
        return res.status(500).json({ error: "Server misconfiguration" });
      }

      const configuration = await fetch(discovery_endpoint);
      const { authorization_endpoint } = await configuration.json();
      const parameters: Record<string, string> = {
        response_type: "code",
        scope: "openid profile email",
        client_id: client_id,
        redirect_uri: `${req.protocol}://${req.headers.host}/api/login/entraid/callback`,
      };

      const authorization_url = `${authorization_endpoint}?${new URLSearchParams(parameters)}`;
      res.redirect(authorization_url);
    });

    app.get("/api/login/linkedin/start", async (req, res) => {
      const discovery_endpoint =
        "https://www.linkedin.com/oauth/.well-known/openid-configuration";
      const client_id = LINKEDIN_CLIENT_ID || "";
      if (!client_id) {
        console.error("LINKEDIN_CLIENT_ID is not defined");
        return res.status(500).json({ error: "Server misconfiguration" });
      }

      const configuration = await fetch(discovery_endpoint);
      const { authorization_endpoint } = await configuration.json();
      const parameters: Record<string, string> = {
        response_type: "code",
        scope: "openid profile email",
        client_id: client_id,
        redirect_uri: `${req.protocol}://${req.headers.host}/api/login/linkedin/callback`,
      };

      const authorization_url = `${authorization_endpoint}?${new URLSearchParams(parameters)}`;
      res.redirect(authorization_url);
    });

    app.get("/api/login/google/start", async (req, res) => {
      const discovery_endpoint =
        "https://accounts.google.com/.well-known/openid-configuration";
      const client_id = GOOGLE_CLIENT_ID || "";
      if (!client_id) {
        console.error("GOOGLE_CLIENT_ID is not defined");
        return res.status(500).json({ error: "Server misconfiguration" });
      }

      const configuration = await fetch(discovery_endpoint);
      const { authorization_endpoint } = await configuration.json();
      const parameters: Record<string, string> = {
        response_type: "code",
        scope: "openid profile email",
        client_id: client_id,
        redirect_uri: `${req.protocol}://${req.headers.host}/api/login/google/callback`,
      };

      const authorization_url = `${authorization_endpoint}?${new URLSearchParams(parameters)}`;
      res.redirect(authorization_url);
    });

    app.get("/api/login/google/callback", async (req, res) => {
      const { code } = req.query;
      const discovery_endpoint =
        "https://accounts.google.com/.well-known/openid-configuration";
      const configuration = await fetch(discovery_endpoint);
      const { token_endpoint } = await configuration.json();

      const tokenResult = await fetch(token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          code: code as string,
          redirect_uri: `${req.protocol}://${req.headers.host}/api/login/google/callback`,
        }),
      });

      if (tokenResult.ok) {
        const { access_token } = await tokenResult.json();
        res.cookie("access_token", access_token);
        res.cookie("discovery_endpoint", discovery_endpoint);

        return res.redirect("/Registered");
      } else {
        console.error("Google token fetch failed:", await tokenResult.text());
        return res
          .status(500)
          .json({ message: "Failed to complete Google login." });
      }
    });

    app.get("/api/login/linkedin/callback", async (req, res) => {
      const { code } = req.query;
      const discovery_endpoint =
        "https://www.linkedin.com/oauth/.well-known/openid-configuration";
      const configuration = await fetch(discovery_endpoint);
      const { token_endpoint } = await configuration.json();

      const tokenResult = await fetch(token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: LINKEDIN_CLIENT_ID!,
          client_secret: LINKEDIN_CLIENT_SECRET!,
          code: code as string,
          redirect_uri: `${req.protocol}://${req.headers.host}/api/login/linkedin/callback`,
        }),
      });

      if (tokenResult.ok) {
        const { access_token } = await tokenResult.json();
        res.cookie("access_token", access_token);
        res.cookie("discovery_endpoint", discovery_endpoint);

        return res.redirect("/Registered");
      } else {
        console.error("Linkedin token fetch failed:", await tokenResult.text());
        return res
          .status(500)
          .json({ message: "Failed to complete Linkedin login." });
      }
    });

    app.get("/api/login/entraid/callback", async (req, res) => {
      const { code } = req.query;
      const discovery_endpoint =
        "https://login.microsoftonline.com/organizations/v2.0/.well-known/openid-configuration";
      const configuration = await fetch(discovery_endpoint);
      const { token_endpoint } = await configuration.json();

      const tokenResult = await fetch(token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: ENTRAID_CLIENT_ID!,
          client_secret: ENTRAID_CLIENT_SECRET!,
          code: code as string,
          redirect_uri: `${req.protocol}://${req.headers.host}/api/login/entraid/callback`,
        }),
      });

      if (tokenResult.ok) {
        const { access_token } = await tokenResult.json();
        res.cookie("access_token", access_token);
        res.cookie("discovery_endpoint", discovery_endpoint);

        return res.redirect("/Registered");
      } else {
        console.error("Entraid token fetch failed:", await tokenResult.text());
        return res
          .status(500)
          .json({ message: "Failed to complete Entraid login." });
      }
    });

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
