import express, { Request, Response } from "express";
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

const client = new MongoClient(process.env.MONGODB_URI!);

client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");

    const db = client.db("eventdb");
    const eventsCollection = db.collection("eventdb");

    app.get("/api/event", async (Request: Request, Response: Response) => {
      const { category, place, startTime, endTime, search } = Request.query;
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

        Response.json(eventsWithAttendeesCount);
      } catch (error) {
        console.error("Error fetching events:", error);
        Response.status(500).json({ message: "Internal server error" });
      }
    });

    app.get(
      "/api/events/:eventId/users",
      async (Request: Request, Response: Response) => {
        const { eventId } = Request.params;

        try {
          const usersCollection = client.db("eventdb").collection("users");
          const users = await usersCollection
            .find({ joinedEvents: eventId })
            .toArray();
          Response.status(200).json({ count: users.length });
        } catch (error) {
          console.error("Error fetching users:", error);
          Response.status(500).json({ message: "Internal server error" });
        }
      },
    );

    app.get(
      "/api/events/:eventId/attendees",
      async (Request: Request, Response: Response) => {
        const { eventId } = Request.params;

        try {
          const usersCollection = client.db("eventdb").collection("users");
          const attendees = await usersCollection
            .find({ joinedEvents: eventId })
            .toArray();
          Response.status(200).json({ count: attendees.length });
        } catch (error) {
          console.error("Error fetching attendees:", error);
          Response.status(500).json({ message: "Internal server error" });
        }
      },
    );

    app.post("/api/event", async (Request: Request, Response: Response) => {
      const newEvent = Request.body;

      try {
        const existingEvent = await eventsCollection.findOne({
          title: newEvent.title,
        });
        if (existingEvent) {
          return Response.status(400).json({
            message: "Event with the same title already exists",
          });
        }

        const result = await eventsCollection.insertOne(newEvent);
        newEvent._id = result.insertedId;
        Response.status(201).json(newEvent);
      } catch (error) {
        console.error("Error saving event:", error);
        Response.status(400).json({ message: "Error saving event" });
      }
    });

    app.get(
      "/api/event/:eventTitle",
      async (Request: Request, Response: Response) => {
        const { eventTitle } = Request.params;

        try {
          const event = await eventsCollection.findOne({ title: eventTitle });
          if (!event) {
            return Response.status(404).json({ message: "Event not found" });
          }

          const organizer = await db
            .collection("users")
            .findOne({ _id: new ObjectId(event.organizerId) });
          if (!organizer) {
            return Response.status(404).json({
              message: "Organizer not found",
            });
          }

          const eventDetails = {
            title: event.title,
            description: event.description,
            time: event.date,
            place: event.place,
            organizerName: organizer.name,
            organizerPhoto: organizer.photo,
          };

          Response.json(eventDetails);
        } catch (error) {
          console.error("Error fetching event details:", error);
          Response.status(500).json({ message: "Internal server error" });
        }
      },
    );

    app.post(
      "/api/join/:eventTitle",
      async (Request: Request, Response: Response) => {
        const { eventTitle } = Request.params;
        const { userId } = Request.body;

        if (!userId) {
          console.error("Invalid or missing userId:", userId);
          return Response.status(400).json({
            message: "Invalid or missing userId",
          });
        }

        try {
          const usersCollection = db.collection("users");
          const event = await eventsCollection.findOne({ title: eventTitle });
          if (!event) {
            console.error("Event not found:", eventTitle);
            return Response.status(404).json({ message: "Event not found" });
          }

          const result = await usersCollection.updateOne(
            { _id: userId },
            { $addToSet: { joinedEvents: event._id } },
            { upsert: true },
          );

          if (result.modifiedCount === 0 && result.upsertedCount === 0) {
            return Response.status(400).json({
              message: "Event already joined",
            });
          }

          Response.status(200).json({
            message: "Successfully joined the event!",
          });
        } catch (error) {
          console.error("Error joining event:", error);
          Response.status(500).json({ message: "Internal server error" });
        }
      },
    );

    app.post(
      "/api/user/join-event",
      async (Request: Request, Response: Response) => {
        const { userId, eventId } = Request.body;

        if (!userId || !eventId) {
          return Response.status(400).json({
            message: "User ID and Event ID are required",
          });
        }

        try {
          const usersCollection = client.db("eventdb").collection("users");

          // Update the user document to add the event ID to the joined events array
          const result = await usersCollection.updateOne(
            { id: userId },
            { $addToSet: { joinedEvents: eventId } },
          );

          if (result.modifiedCount === 0) {
            return Response.status(404).json({ message: "User not found" });
          }

          Response.status(200).json({ message: "Event joined successfully" });
        } catch (error) {
          console.error("Failed to join event:", error);
          Response.status(500).json({ message: "Internal server error" });
        }
      },
    );

    app.get(
      "/api/user/joined-events",
      async (Request: Request, Response: Response) => {
        const userId = Request.query.userId;

        if (!userId) {
          return Response.status(400).json({ message: "User ID is required" });
        }

        try {
          const usersCollection = client.db("eventdb").collection("users");
          const eventsCollection = client.db("eventdb").collection("eventdb");

          const user = await usersCollection.findOne({ id: userId });

          if (!user) {
            return Response.status(404).json({ message: "User not found" });
          }

          const joinedEvents = await eventsCollection
            .find({
              _id: {
                $in: user.joinedEvents.map((id: string) => new ObjectId(id)),
              },
            })
            .toArray();

          Response.status(200).json(joinedEvents);
        } catch (error) {
          console.error("Failed to fetch joined events:", error);
          Response.status(500).json({ message: "Internal server error" });
        }
      },
    );

    app.get(
      "/api/event/:eventId/attendees",
      async (Request: Request, Response: Response) => {
        const { eventId } = Request.params;

        if (!ObjectId.isValid(eventId)) {
          return Response.status(400).json({ message: "Invalid eventId" });
        }

        try {
          const eventsCollection = db.collection("eventdb");
          const usersCollection = db.collection("users");

          const event = await eventsCollection.findOne({
            _id: new ObjectId(eventId),
          });
          if (!event) {
            return Response.status(404).json({ message: "Event not found" });
          }

          const attendees = await usersCollection
            .find({
              joinedEvents: { $elemMatch: { $eq: new ObjectId(eventId) } },
            })
            .project({ name: 1, email: 1, picture: 1 })
            .toArray();

          console.log("Attendees for event:", attendees);
          Response.status(200).json(attendees);
        } catch (error) {
          console.error("Error fetching attendees:", error);
          Response.status(500).json({ message: "Internal server error" });
        }
      },
    );

    app.get(
      "/api/user/events/:userId",
      async (Request: Request, Response: Response) => {
        const { userId } = Request.params;

        try {
          const usersCollection = db.collection("users");
          const eventsCollection = db.collection("eventdb");

          const user = await usersCollection.findOne({
            _id: new ObjectId(userId),
          });
          if (!user || !user.joinedEvents || user.joinedEvents.length === 0) {
            return Response.json([]); // Return empty if no joined events
          }

          const events = await eventsCollection
            .find({ _id: { $in: user.joinedEvents } })
            .toArray();
          Response.json(events);
        } catch (error) {
          console.error(
            `Error fetching user events: userId=${userId}, error=${error}`,
          );
          Response.status(500).json({
            message: "Failed to fetch user events. Please try again later.",
          });
        }
      },
    );

    app.get(
      "/api/user/events/:userId",
      async (Request: Request, Response: Response) => {
        const { userId } = Request.params;

        try {
          const usersCollection = db.collection("users");
          const eventsCollection = db.collection("eventdb");

          const user = await usersCollection.findOne({
            _id: new ObjectId(userId),
          });
          if (!user || !user.joinedEvents) {
            return Response.json([]);
          }

          const events = await eventsCollection
            .find({ _id: { $in: user.joinedEvents } })
            .toArray();
          Response.json(events);
        } catch (error) {
          console.error("Error fetching user events:", error);
          Response.status(500).json({ message: "Internal server error" });
        }
      },
    );

    app.put(
      "/api/event/name/:eventName",
      async (Request: Request, Response: Response) => {
        const { eventName } = Request.params;
        const updatedEvent = Request.body;

        try {
          const result = await eventsCollection.updateOne(
            { title: eventName },
            { $set: updatedEvent },
          );

          if (result.modifiedCount === 0) {
            return Response.status(404).json({
              message: "Event not found or no changes made",
            });
          }

          Response.status(200).json({ message: "Event updated successfully" });
        } catch (error) {
          console.error("Error updating event:", error);
          Response.status(500).json({ message: "Internal server error" });
        }
      },
    );

    app.delete(
      "/api/event/name/:eventName",
      async (Request: Request, Response: Response) => {
        const { eventName } = Request.params;
        console.log("Attempting to delete event with name:", eventName);

        try {
          const result = await eventsCollection.deleteOne({ title: eventName });
          console.log("Delete result:", result);

          if (result.deletedCount === 0) {
            return Response.status(404).json({ message: "Event not found" });
          }

          Response.status(200).json({ message: "Event deleted successfully" });
        } catch (error) {
          console.error("Error deleting event:", error);
          Response.status(500).json({ message: "Internal server error" });
        }
      },
    );

    app.get("/api/userinfo", async (Request: Request, Response: Response) => {
      const { access_token, discovery_endpoint } = Request.cookies;

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
          const user = {
            id: userinfo.sub, // Map sub to id
            name: userinfo.name,
            email: userinfo.email,
            picture: userinfo.picture,
            ...userinfo,
          };
          return Response.status(200).json(user);
        }
        return Response.status(userinfoRes.status).json(userinfo);
      }

      Response.sendStatus(401);
    });

    app.post("/api/login", (Request: Request, Response: Response) => {
      const { access_token, discovery_endpoint } = Request.body;
      Response.cookie("access_token", access_token);
      Response.cookie("discovery_endpoint", discovery_endpoint);
      Response.sendStatus(201);
    });

    app.get(
      "/api/login/end_session",
      async (Request: Request, Response: Response) => {
        Response.clearCookie("access_token");
        Response.clearCookie("discovery_endpoint");
        Response.redirect("/");
      },
    );

    app.get(
      "/api/login/entraid/start",
      async (Request: Request, Response: Response) => {
        const discovery_endpoint =
          "https://login.microsoftonline.com/organizations/v2.0/.well-known/openid-configuration";
        const client_id = ENTRAID_CLIENT_ID || "";
        if (!client_id) {
          console.error("ENTRAID_CLIENT_ID is not defined");
          return Response.status(500).json({
            error: "Server misconfiguration",
          });
        }

        const configuration = await fetch(discovery_endpoint);
        const { authorization_endpoint } = await configuration.json();
        const parameters: Record<string, string> = {
          response_type: "code",
          scope: "openid profile email",
          client_id: client_id,
          redirect_uri: `${Request.protocol}://${Request.headers.host}/api/login/entraid/callback`,
        };

        const authorization_url = `${authorization_endpoint}?${new URLSearchParams(parameters)}`;
        Response.redirect(authorization_url);
      },
    );

    app.get(
      "/api/login/linkedin/start",
      async (Request: Request, Response: Response) => {
        const discovery_endpoint =
          "https://www.linkedin.com/oauth/.well-known/openid-configuration";
        const client_id = LINKEDIN_CLIENT_ID || "";
        if (!client_id) {
          console.error("LINKEDIN_CLIENT_ID is not defined");
          return Response.status(500).json({
            error: "Server misconfiguration",
          });
        }

        const configuration = await fetch(discovery_endpoint);
        const { authorization_endpoint } = await configuration.json();
        const parameters: Record<string, string> = {
          response_type: "code",
          scope: "openid profile email",
          client_id: client_id,
          redirect_uri: `${Request.protocol}://${Request.headers.host}/api/login/linkedin/callback`,
        };

        const authorization_url = `${authorization_endpoint}?${new URLSearchParams(parameters)}`;
        Response.redirect(authorization_url);
      },
    );

    app.get(
      "/api/login/google/start",
      async (Request: Request, Response: Response) => {
        const discovery_endpoint =
          "https://accounts.google.com/.well-known/openid-configuration";
        const client_id = GOOGLE_CLIENT_ID || "";
        if (!client_id) {
          console.error("GOOGLE_CLIENT_ID is not defined");
          return Response.status(500).json({
            error: "Server misconfiguration",
          });
        }

        const configuration = await fetch(discovery_endpoint);
        const { authorization_endpoint } = await configuration.json();
        const parameters: Record<string, string> = {
          response_type: "code",
          scope: "openid profile email",
          client_id: client_id,
          redirect_uri: `${Request.protocol}://${Request.headers.host}/api/login/google/callback`,
        };

        const authorization_url = `${authorization_endpoint}?${new URLSearchParams(parameters)}`;
        Response.redirect(authorization_url);
      },
    );

    app.get(
      "/api/login/google/callback",
      async (Request: Request, Response: Response) => {
        const { code } = Request.query;
        const discovery_endpoint =
          "https://accounts.google.com/.well-known/openid-configuration";
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
            redirect_uri: `${Request.protocol}://${Request.headers.host}/api/login/google/callback`,
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

            Response.cookie("access_token", access_token);
            Response.cookie("discovery_endpoint", discovery_endpoint);
            return Response.redirect("/Registered");
          } else {
            console.error(
              "Google userinfo fetch failed:",
              await userinfoRes.text(),
            );
            return Response.status(500).json({
              message: "Failed to fetch Google user info.",
            });
          }
        } else {
          console.error("Google token fetch failed:", await tokenResult.text());
          return Response.status(500).json({
            message: "Failed to complete Google login.",
          });
        }
      },
    );

    app.get(
      "/api/login/linkedin/callback",
      async (Request: Request, Response: Response) => {
        const { code } = Request.query;
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
            redirect_uri: `${Request.protocol}://${Request.headers.host}/api/login/linkedin/callback`,
          }),
        });

        if (tokenResult.ok) {
          const { access_token } = await tokenResult.json();
          Response.cookie("access_token", access_token);
          Response.cookie("discovery_endpoint", discovery_endpoint);

          return Response.redirect("/Registered");
        } else {
          console.error(
            "Linkedin token fetch failed:",
            await tokenResult.text(),
          );
          return Response.status(500).json({
            message: "Failed to complete Linkedin login.",
          });
        }
      },
    );

    app.get(
      "/api/login/entraid/callback",
      async (Request: Request, Response: Response) => {
        const { code } = Request.query;
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
            redirect_uri: `${Request.protocol}://${Request.headers.host}/api/login/entraid/callback`,
          }),
        });

        if (tokenResult.ok) {
          const { access_token } = await tokenResult.json();
          Response.cookie("access_token", access_token);
          Response.cookie("discovery_endpoint", discovery_endpoint);

          return Response.redirect("/Registered");
        } else {
          console.error(
            "Entraid token fetch failed:",
            await tokenResult.text(),
          );
          return Response.status(500).json({
            message: "Failed to complete Entraid login.",
          });
        }
      },
    );

    app.get(
      "/api/event/id/:id",
      async (Request: Request, Response: Response) => {
        const { id } = Request.params;
        try {
          const event = await eventsCollection.findOne({
            _id: new ObjectId(id),
          });
          if (!event) {
            return Response.status(404).json({ message: "Event not found" });
          }
          Response.json(event);
        } catch (error) {
          console.error("Error fetching event:", error);
          Response.status(500).json({ message: "Internal server error" });
        }
      },
    );

    app.put(
      "/api/event/id/:id",
      async (Request: Request, Response: Response) => {
        const { id } = Request.params;
        const updatedEvent = Request.body;

        if (!ObjectId.isValid(id)) {
          return Response.status(400).json({ message: "Invalid event ID" });
        }

        try {
          const { _id, ...updateData } = updatedEvent;

          const result = await eventsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData },
          );
          if (result.modifiedCount === 0) {
            return Response.status(404).json({
              message: "Event not found or no changes made",
            });
          }
          Response.status(200).json({ message: "Event updated successfully" });
        } catch (error) {
          console.error("Error updating event:", error);
          Response.status(500).json({ message: "Internal server error" });
        }
      },
    );

    app.delete(
      "/api/event/id/:id",
      async (Request: Request, Response: Response) => {
        const { id } = Request.params;

        try {
          if (!ObjectId.isValid(id)) {
            return Response.status(400).json({ message: "Invalid event ID" });
          }

          const result = await eventsCollection.deleteOne({
            _id: new ObjectId(id),
          });
          console.log("Delete result:", result);

          if (result.deletedCount === 0) {
            return Response.status(404).json({ message: "Event not found" });
          }

          Response.status(200).json({ message: "Event deleted successfully" });
        } catch (error) {
          console.error("Error deleting event:", error);
          Response.status(500).json({ message: "Internal server error" });
        }
      },
    );

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
