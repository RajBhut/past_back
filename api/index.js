import express from "express";
import userrouter from "./routs/user.routes.js";
import postrouter from "./routs/post.routes.js";
import cors from "cors";
const app = express();
app.use(
  cors({
    origin: ["https://paster.rajb.codes", "http://paster.rajb.codes"],
    credentials: true,
  })
);

// Ensure the headers are properly set for CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});
app.use(express.json());
app.use("/user", userrouter);
app.use("/post", postrouter);
app.get("/", (req, res) => {
  res.send("hellow world");
});

app.listen(3000, () => {
  console.log("started");
});
