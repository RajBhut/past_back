import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const userrouter = Router();
const prisma = new PrismaClient();
userrouter.get("/", (req, res) => {
  const allUsers = prisma.user.findMany();
  res.json(allUsers);
});

userrouter.post("/", async (req, res) => {
  const { username, email, password, name } = req.body;

  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      password,
      name,
    },
  });
  res.json(newUser);
});
userrouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  const user = await prisma.user.findFirst({
    where: {
      email: email,
      password: password,
    },
  });
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});
export default userrouter;
