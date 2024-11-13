import express from "express";
import userrouter from "./routs/user.routes";
import postrouter from "./routs/post.routes";

const app = express();
pp.use(express.json());
app.use(userrouter);
app.use(postrouter);
app.get("/", (req, res) => {
  res.send("hellow world");
});
app.listen(3000, () => {
  console.log("started");
});
