// import express from "express";
// import userrouter from "./routs/user.routes.js";
// import postrouter from "./routs/post.routes.js";
// import cors from "cors";
// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";
// import cookieParser from "cookie-parser";
// const app = express();

// const redis = new Redis({
//   url: process.env.KV_URL,
//   token: process.env.KV_REST_API_TOKEN,
// });
// const rateLimit = new Ratelimit({
//   redis,
//   limiter: Ratelimit.slidingWindow(100, "1m"),
//   prefix: "my-rate-limit",
// });

// const rateLimiterMiddleware = async (req, res, next) => {
//   const identifier = req.ip;
//   const { success, remaining, reset } = await rateLimit.limit(identifier);

//   res.set("X-RateLimit-Limit", "10");
//   res.set("X-RateLimit-Remaining", remaining.toString());
//   res.set("X-RateLimit-Reset", reset.toString());

//   if (!success) {
//     res.status(429).send("Too many requests - try again later");
//     return;
//   }

//   next();
// };
// app.use(rateLimiterMiddleware);
// app.use(
//   cors({
//     origin: process.env.Frontend_URL,
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use(cookieParser());
// app.use("/user", userrouter);
// app.use("/post", postrouter);
// app.get("/", (req, res) => {
//   res.send("hellow world");
// });

// app.listen(3000, () => {
//   console.log("started");
// });
import express from "express";
import userrouter from "./routs/user.routes.js";
import postrouter from "./routs/post.routes.js";
import cors from "cors";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import cluster from "cluster";
import os from "os";

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const app = express();

  const redis = new Redis({
    url: process.env.KV_URL,
    token: process.env.KV_REST_API_TOKEN,
    connectionPoolSize: 10,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  const rateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1m"),
    prefix: "my-rate-limit",
    analytics: true,
  });

  const rateLimiterMiddleware = async (req, res, next) => {
    if (req.path.startsWith("/static/")) {
      return next();
    }

    const identifier = req.ip;

    try {
      const { success, remaining, reset } = await rateLimit.limit(identifier);

      res.set("X-RateLimit-Limit", "100");
      res.set("X-RateLimit-Remaining", remaining.toString());
      res.set("X-RateLimit-Reset", reset.toString());

      if (!success) {
        return res.status(429).send("Too many requests - try again later");
      }

      next();
    } catch (error) {
      console.error("Rate limit error:", error);
      next();
    }
  };

  app.use(helmet());

  app.use(compression());

  app.use(
    cors({
      origin: process.env.Frontend_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      maxAge: 600,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use(cookieParser());

  app.use(rateLimiterMiddleware);

  app.use("/user", userrouter);
  app.use("/post", postrouter);

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/", (req, res) => {
    res.send("Hello world");
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : err.message,
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      error: "Not Found",
      message: "The requested resource was not found",
    });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(
      `Worker ${process.pid} started. Server running on port ${PORT}`
    );
  });
}

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});
