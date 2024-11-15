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

app.use(express.json());
app.use("/user", userrouter);
app.use("/post", postrouter);
app.get("/", (req, res) => {
  res.send("hellow world");
});

app.listen(3000, () => {
  console.log("started");
});
