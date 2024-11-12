import express from "express";
import { MongoClient } from "mongodb";
import bodyParser from "body-parser";
import { eventRouter } from "./eventRouter";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const client = new MongoClient(
  process.env.MONGODB_URI ||
    "mongodb+srv://simonnbnilsen:59eFeYz3YtZu70cb@cluster0.18lyj.mongodb.net/",
);

client
  .connect()
  .then(() => {
    const db = client.db("eventdb");
    app.use("/api/event", eventRouter(db));

    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
      console.log("Client connected");
    });

    app.post("/api/event", async (req, res) => {
      const { title, date, description, category, place } = req.body;
      const newEvent = { title, date, description, category, place };
      try {
        await db.collection("eventdb").insertOne(newEvent);
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(newEvent));
          }
        });
        res.sendStatus(201);
      } catch (error) {
        res.status(400).send(error);
      }
    });
  })
  .catch((err) => {
    console.error(err);
  });
