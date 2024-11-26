import express, { Request, Response } from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

dotenv.config();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const ENTRAID_CLIENT_ID = process.env.ENTRAID_CLIENT_ID;
const ENTRAID_CLIENT_SECRET = process.env.ENTRAID_CLIENT_SECRET;

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);

app.use(express.static(path.join(__dirname, "../client/dist")));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const client = new MongoClient(process.env["MONGODB_URL"]!);

client.connect().then(() => {
  console.log("Connected to MongoDB");

  const db = client.db("eventdb");
  const eventsCollection = db.collection("eventdb");

  app.get("/", (req, res) => {
    res.send("Hello, World!");
  });

  app.get("/api/event", async (req: Request, res: Response): Promise<void> => {
    try {
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

      const eventsCollection = client.db("eventdb").collection("eventdb");
      const usersCollection = client.db("eventdb").collection("users");

      const events = await eventsCollection.find(query).toArray();

      const eventsWithAttendeesCount = await Promise.all(
        events.map(async (event) => {
          const attendeeCount = await usersCollection.countDocuments({
            joinedEvents: event._id.toString(),
          });
          return {
            ...event,
            attendeesCount: attendeeCount,
          };
        }),
      );

      res.status(200).json(eventsWithAttendeesCount);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(
    "/api/events/:eventId/users",
    async (req: Request, res: Response): Promise<void> => {
      const { eventId } = req.params;

      try {
        const usersCollection = client.db("eventdb").collection("users");
        const users = await usersCollection
          .find({ joinedEvents: eventId })
          .toArray();
        res.status(200).json({ count: users.length });
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/events/:eventId/attendees",
    async (req: Request, res: Response): Promise<void> => {
      const { eventId } = req.params;

      try {
        const usersCollection = client.db("eventdb").collection("users");
        const attendees = await usersCollection
          .find({ joinedEvents: eventId })
          .toArray();
        res.status(200).json({ count: attendees.length });
      } catch (error) {
        console.error("Error fetching attendees:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post("/api/event", async (req: Request, res: Response): Promise<void> => {
    const newEvent = req.body;

    try {
      const existingEvent = await eventsCollection.findOne({
        title: newEvent.title,
      });

      if (existingEvent) {
        res
          .status(400)
          .json({ message: "Event with the same title already exists" });
        return;
      }

      const result = await eventsCollection.insertOne(newEvent);
      newEvent._id = result.insertedId;
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error saving event:", error);
      res.status(400).json({ message: "Error saving event" });
    }
  });

  app.get(
    "/api/event/:eventTitle",
    async (req: Request, res: Response): Promise<void> => {
      const { eventTitle } = req.params;

      try {
        const event = await eventsCollection.findOne({ title: eventTitle });
        if (!event) {
          res.status(404).json({ message: "Event not found" });
          return;
        }

        const organizer = await db
          .collection("users")
          .findOne({ _id: new ObjectId(event.organizerId) });

        if (!organizer) {
          res.status(404).json({ message: "Organizer not found" });
          return;
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
    },
  );

  app.post(
    "/api/join/:eventTitle",
    async (req: Request, res: Response): Promise<void> => {
      const { eventTitle } = req.params;
      const { userId } = req.body;

      if (!userId) {
        console.error("Invalid or missing userId:", userId);
        res.status(400).json({
          message: "Invalid or missing userId",
        });
        return;
      }

      try {
        const usersCollection = db.collection("users");
        const event = await eventsCollection.findOne({ title: eventTitle });

        if (!event) {
          console.error("Event not found:", eventTitle);
          res.status(404).json({ message: "Event not found" });
          return;
        }

        const result = await usersCollection.updateOne(
          { _id: userId },
          { $addToSet: { joinedEvents: event._id } },
          { upsert: true },
        );

        if (result.modifiedCount === 0 && result.upsertedCount === 0) {
          res.status(400).json({
            message: "Event already joined",
          });
          return;
        }

        res.status(200).json({
          message: "Successfully joined the event!",
        });
      } catch (error) {
        console.error("Error joining event:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/user/join-event",
    async (req: Request, res: Response): Promise<void> => {
      const { userId, eventId } = req.body;

      if (!userId || !eventId) {
        res.status(400).json({
          message: "User ID and Event ID are required",
        });
        return;
      }

      try {
        const usersCollection = client.db("eventdb").collection("users");

        // Update the user document to add the event ID to the joined events array
        const result = await usersCollection.updateOne(
          { id: userId },
          { $addToSet: { joinedEvents: eventId } },
        );

        if (result.modifiedCount === 0) {
          res.status(404).json({ message: "User not found" });
          return;
        }

        res.status(200).json({ message: "Event joined successfully" });
      } catch (error) {
        console.error("Failed to join event:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/user/joined-events",
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.query.userId;

      if (!userId) {
        res.status(400).json({ message: "User ID is required" });
        return;
      }

      try {
        const usersCollection = client.db("eventdb").collection("users");
        const eventsCollection = client.db("eventdb").collection("eventdb");

        const user = await usersCollection.findOne({ id: userId });

        if (!user) {
          res.status(404).json({ message: "User not found" });
          return;
        }

        const joinedEvents = await eventsCollection
          .find({
            _id: {
              $in: user.joinedEvents.map((id: string) => new ObjectId(id)),
            },
          })
          .toArray();

        res.status(200).json(joinedEvents);
      } catch (error) {
        console.error("Failed to fetch joined events:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/event/:eventId/attendees",
    async (req: Request, res: Response): Promise<void> => {
      const { eventId } = req.params;

      if (!ObjectId.isValid(eventId)) {
        res.status(400).json({ message: "Invalid eventId" });
        return;
      }

      try {
        const eventsCollection = db.collection("eventdb");
        const usersCollection = db.collection("users");

        const event = await eventsCollection.findOne({
          _id: new ObjectId(eventId),
        });

        if (!event) {
          res.status(404).json({ message: "Event not found" });
          return;
        }

        const attendees = await usersCollection
          .find({
            joinedEvents: { $elemMatch: { $eq: new ObjectId(eventId) } },
          })
          .project({ name: 1, email: 1, picture: 1 })
          .toArray();

        console.log("Attendees for event:", attendees);
        res.status(200).json(attendees);
      } catch (error) {
        console.error("Error fetching attendees:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/user/events/:userId",
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params;

      try {
        const usersCollection = db.collection("users");
        const eventsCollection = db.collection("eventdb");

        const user = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });

        if (!user || !user.joinedEvents || user.joinedEvents.length === 0) {
          res.json([]); // Return empty if no joined events
          return;
        }

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
    },
  );

  app.get(
    "/api/user/events/:userId",
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params;

      try {
        const usersCollection = db.collection("users");
        const eventsCollection = db.collection("eventdb");

        const user = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });

        if (!user || !user.joinedEvents) {
          res.json([]);
          return;
        }

        const events = await eventsCollection
          .find({ _id: { $in: user.joinedEvents } })
          .toArray();

        res.json(events);
      } catch (error) {
        console.error("Error fetching user events:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.put(
    "/api/event/name/:eventName",
    async (req: Request, res: Response): Promise<void> => {
      const { eventName } = req.params;
      const updatedEvent = req.body;

      try {
        const result = await eventsCollection.updateOne(
          { title: eventName },
          { $set: updatedEvent },
        );

        if (result.modifiedCount === 0) {
          res.status(404).json({
            message: "Event not found or no changes made",
          });
          return; // Ensure function stops execution after sending response
        }

        res.status(200).json({ message: "Event updated successfully" });
      } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.delete(
    "/api/event/name/:eventName",
    async (req: Request, res: Response): Promise<void> => {
      const { eventName } = req.params;
      console.log("Attempting to delete event with name:", eventName);

      try {
        const result = await eventsCollection.deleteOne({ title: eventName });
        console.log("Delete result:", result);

        if (result.deletedCount === 0) {
          res.status(404).json({ message: "Event not found" });
          return; // Ensure function stops execution after sending response
        }

        res.status(200).json({ message: "Event deleted successfully" });
      } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/userinfo",
    async (req: Request, res: Response): Promise<void> => {
      const { access_token, discovery_endpoint } = req.cookies;

      if (access_token) {
        try {
          const configuration = await fetch(discovery_endpoint);
          const { userinfo_endpoint } = await configuration.json();

          const userinfoRes = await fetch(userinfo_endpoint, {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          });

          const userinfo = await userinfoRes.json();
          if (userinfoRes.ok) {
            const user = {
              id: userinfo.sub, // Map sub to id
              name: userinfo.name,
              email: userinfo.email,
              picture: userinfo.picture,
              ...userinfo,
            };
            res.status(200).json(user);
            return; // Ensure function stops execution after sending response
          }

          res.status(userinfoRes.status).json(userinfo);
          return; // Ensure function stops execution after sending response
        } catch (error) {
          console.error("Error fetching user info:", error);
          res.status(500).json({ message: "Internal server error" });
          return; // Ensure function stops execution after sending response
        }
      }

      res.sendStatus(401); // Unauthorized
    },
  );

  app.post("/api/login", (req: Request, res: Response): void => {
    const { access_token, discovery_endpoint } = req.body;
    res.cookie("access_token", access_token);
    res.cookie("discovery_endpoint", discovery_endpoint);
    res.sendStatus(201); // Created
  });

  app.get("/api/login/end_session", (req: Request, res: Response): void => {
    res.clearCookie("access_token");
    res.clearCookie("discovery_endpoint");
    res.redirect("/");
  });

  app.get(
    "/api/login/entraid/start",
    async (req: Request, res: Response): Promise<void> => {
      const discovery_endpoint =
        "https://login.microsoftonline.com/organizations/v2.0/.well-known/openid-configuration";
      const client_id = ENTRAID_CLIENT_ID || "";

      if (!client_id) {
        console.error("ENTRAID_CLIENT_ID is not defined");
        res.status(500).json({
          error: "Server misconfiguration",
        });
        return; // Stop execution after sending response
      }

      try {
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
      } catch (error) {
        console.error("Error during EntraID login start:", error);
        res.status(500).json({ message: "Failed to initiate login process" });
      }
    },
  );

  app.get(
    "/api/login/linkedin/start",
    async (req: Request, res: Response): Promise<void> => {
      const discovery_endpoint =
        "https://www.linkedin.com/oauth/.well-known/openid-configuration";
      const client_id = LINKEDIN_CLIENT_ID || "";

      if (!client_id) {
        console.error("LINKEDIN_CLIENT_ID is not defined");
        res.status(500).json({
          error: "Server misconfiguration",
        });
        return; // Stop execution after sending response
      }

      try {
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
      } catch (error) {
        console.error("Error during LinkedIn login start:", error);
        res.status(500).json({ message: "Failed to initiate login process" });
      }
    },
  );

  app.get(
    "/api/login/google/start",
    async (req: Request, res: Response): Promise<void> => {
      const discovery_endpoint =
        "https://accounts.google.com/.well-known/openid-configuration";
      const client_id = GOOGLE_CLIENT_ID || "";

      if (!client_id) {
        console.error("GOOGLE_CLIENT_ID is not defined");
        res.status(500).json({
          error: "Server misconfiguration",
        });
        return; // Stop further execution after responding
      }

      try {
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
      } catch (error) {
        console.error("Error initiating Google login:", error);
        res
          .status(500)
          .json({ message: "Failed to initiate Google login process." });
      }
    },
  );

  app.get(
    "/api/login/google/callback",
    async (req: Request, res: Response): Promise<void> => {
      const { code } = req.query;

      if (!code) {
        res.status(400).json({ message: "Authorization code is missing" });
        return; // Stop further execution after responding
      }

      const discovery_endpoint =
        "https://accounts.google.com/.well-known/openid-configuration";

      try {
        const configuration = await fetch(discovery_endpoint);
        const { token_endpoint, userinfo_endpoint } =
          await configuration.json();

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

          const userinfoRes = await fetch(userinfo_endpoint, {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          });

          if (userinfoRes.ok) {
            const userinfo = await userinfoRes.json();
            const user = {
              id: userinfo.sub,
              name: userinfo.name,
              email: userinfo.email,
              picture: userinfo.picture,
              ...userinfo,
            };

            const usersCollection = client.db("eventdb").collection("users");

            await usersCollection.updateOne(
              { id: user.id },
              { $set: user },
              { upsert: true },
            );

            res.cookie("access_token", access_token);
            res.cookie("discovery_endpoint", discovery_endpoint);
            res.redirect("/Registered");
          } else {
            console.error(
              "Google userinfo fetch failed:",
              await userinfoRes.text(),
            );
            res.status(500).json({
              message: "Failed to fetch Google user info.",
            });
          }
        } else {
          console.error("Google token fetch failed:", await tokenResult.text());
          res.status(500).json({
            message: "Failed to complete Google login.",
          });
        }
      } catch (error) {
        console.error("Error during Google login callback:", error);
        res
          .status(500)
          .json({ message: "An error occurred during Google login." });
      }
    },
  );

  app.get(
    "/api/login/linkedin/callback",
    async (req: Request, res: Response): Promise<void> => {
      const { code } = req.query;
      if (!code) {
        res.status(400).json({ message: "Authorization code is missing" });
        return; // Stop further execution after responding
      }

      const discovery_endpoint =
        "https://www.linkedin.com/oauth/.well-known/openid-configuration";

      try {
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

          res.redirect("/Registered");
        } else {
          console.error(
            "Linkedin token fetch failed:",
            await tokenResult.text(),
          );
          res.status(500).json({
            message: "Failed to complete Linkedin login.",
          });
        }
      } catch (error) {
        console.error("Error during LinkedIn login callback:", error);
        res
          .status(500)
          .json({ message: "An error occurred during LinkedIn login." });
      }
    },
  );

  app.get(
    "/api/login/entraid/callback",
    async (req: Request, res: Response): Promise<void> => {
      const { code } = req.query;
      if (!code) {
        res.status(400).json({ message: "Authorization code is missing" });
        return; // Stop further execution after responding
      }

      const discovery_endpoint =
        "https://login.microsoftonline.com/organizations/v2.0/.well-known/openid-configuration";

      try {
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

          res.redirect("/Registered");
        } else {
          console.error(
            "Entraid token fetch failed:",
            await tokenResult.text(),
          );
          res.status(500).json({
            message: "Failed to complete Entraid login.",
          });
        }
      } catch (error) {
        console.error("Error during EntraID login callback:", error);
        res
          .status(500)
          .json({ message: "An error occurred during EntraID login." });
      }
    },
  );

  app.get(
    "/api/event/id/:id",
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid event ID" });
        return;
      }

      try {
        const event = await eventsCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!event) {
          res.status(404).json({ message: "Event not found" });
          return;
        }
        res.json(event);
      } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.put(
    "/api/event/id/:id",
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const updatedEvent = req.body;

      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid event ID" });
        return;
      }

      try {
        const { _id, ...updateData } = updatedEvent;

        const result = await eventsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData },
        );
        if (result.modifiedCount === 0) {
          res.status(404).json({
            message: "Event not found or no changes made",
          });
          return;
        }
        res.status(200).json({ message: "Event updated successfully" });
      } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.delete(
    "/api/event/id/:id",
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid event ID" });
        return;
      }

      try {
        const result = await eventsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        console.log("Delete result:", result);

        if (result.deletedCount === 0) {
          res.status(404).json({ message: "Event not found" });
          return;
        }

        res.status(200).json({ message: "Event deleted successfully" });
      } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
  });

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
});
