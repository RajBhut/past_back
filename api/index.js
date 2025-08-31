import express from "express";
import userrouter from "./routs/user.routes.js";
import postrouter from "./routs/post.routes.js";
import cors from "cors";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import cookieParser from "cookie-parser";
const app = express();

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});
const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(500, "1m"),
  prefix: "my-rate-limit",
});

const rateLimiterMiddleware = async (req, res, next) => {
  const identifier = req.ip;
  const { success, remaining, reset } = await rateLimit.limit(identifier);

  res.set("X-RateLimit-Limit", "10");
  res.set("X-RateLimit-Remaining", remaining.toString());
  res.set("X-RateLimit-Reset", reset.toString());

  if (!success) {
    res.status(429).send("Too many requests - try again later");
    return;
  }

  next();
};
app.use(rateLimiterMiddleware);
app.use(
  cors({
    origin: process.env.Frontend_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/user", userrouter);
app.use("/post", postrouter);
app.get("/", (req, res) => {
  res.send("hellow world");
});

app.listen(3000, () => {
  console.log("started");
});
