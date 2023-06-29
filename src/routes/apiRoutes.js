import express from "express";
import dayjs from "dayjs";

import { db } from "../config/db.js";

const router = express.Router();

router.post("/participants", async (req, res) => {
  const { name } = req.body;

  try {
    const lastStatus = Date.now();
    const timeFormated = dayjs(lastStatus).format("HH:mm:ss");

    await db.collection("participants").insertOne({
      name,
      lastStatus,
    });

    await db.collection("messages").insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: timeFormated,
    });

    return res.sendStatus(201);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

router.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    return res.status(200).json(participants);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

router.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;

  try {
    const resp = await db.collection("participants").findOne({ name: user });
    if (!resp) return res.sendStatus(422);

    await db.collection("messages").insertOne({
      from: user,
      to,
      text,
      type,
      time: dayjs(Date.now()).format("HH:mm:ss"),
    });

    return res.sendStatus(201);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

router.get("/messages", async (req, res) => {
  const { user } = req.headers;
  const { limit } = req.query;

  if (limit && (limit <= 0 || isNaN(limit) == true)) {
    return res.sendStatus(422);
  }

  try {
    let messages;

    if (!limit) {
      messages = await db
        .collection("messages")
        .find({
          $or: [{ to: "Todos" }, { to: user }, { from: user }],
        })
        .sort({ _id: -1 })
        .toArray();
    } else {
      // db.suaColecao.find().sort({ _id: -1 }).limit(10)

      messages = await db
        .collection("messages")
        .find({
          $or: [{ to: "Todos" }, { to: user }, { from: user }],
        })
        .sort({ _id: -1 })
        .limit(parseInt(limit))
        .toArray();
    }

    return res.status(200).json(messages);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

export default router;
