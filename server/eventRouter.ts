import express from "express";
import { Db } from "mongodb";

export function eventRouter(db: Db) {
  const event = db.collection("eventdb");
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const events = await event.find().toArray();
      res.json(events);
    } catch (error) {
      res.status(500).send(error);
    }
  });

  router.post("/", async (req, res) => {
    const { title, date, description } = req.body;
    const newEvent = { title, date, description };
    try {
      await event.insertOne(newEvent);
      res.sendStatus(201);
    } catch (error) {
      res.status(400).send(error);
    }
  });

  return router;
}
