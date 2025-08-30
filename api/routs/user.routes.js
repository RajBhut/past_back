import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userrouter = Router();
const prisma = new PrismaClient();
const genrateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const compare_passs = async (password, db_pass) => {
  return bcrypt.compareSync(password, db_pass);
};
export const auth = async (req, res, next) => {
  if (!req.cookies.jwt) {
    console.log("no token");
    return res.status(401).send("Unauthorized: No token provided");
  }

  try {
    const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        password: false,
      },
    });

    if (!user) {
      return res.status(401).send("Unauthorized: Invalid token");
    } else {
      res.header("Access-Control-Allow-Origin", `${process.env.Frontend_URL}`);
      res.header("Access-Control-Allow-Credentials", "true");
      req.user = user;

      next();
    }
  } catch (error) {
    console.log("Token verification failed:", error);
    return res.status(401).send("Unauthorized: Token verification failed");
  }
};

userrouter.get("/", (req, res) => {
  const allUsers = prisma.user.findMany();
  res.json(allUsers);
});

userrouter.post("/", async (req, res) => {
  let { username, email, password, name } = req.body;
  try {
    password = bcrypt.hashSync(password, 10);

    // Generate username if not provided
    if (!username) {
      username = `user_${Date.now()}`;
    }

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password,
        name,
        avatar: "", // Default empty avatar
      },
    });

    const token = genrateToken(newUser.id);
    res.header("Access-Control-Allow-Origin", `${process.env.Frontend_URL}`);
    res.header("Access-Control-Allow-Credentials", "true");

    res.cookie("jwt", token, {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    });

    res.json(newUser);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error in creating user");
  }
});

userrouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  let boo = await compare_passs(password, user.password);
  if (boo && user) {
    const token = genrateToken(user.id);
    res.header("Access-Control-Allow-Origin", `${process.env.Frontend_URL}`);
    res.header("Access-Control-Allow-Credentials", "true");

    res.cookie("jwt", token, {
      sameSite: "none",
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 * 5,
    });

    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});
userrouter.post("/logout", (req, res) => {
  res.clearCookie("jwt", {
    sameSite: "none",
    secure: true,
    httpOnly: true,
  });
  res.json({ message: "User logged out successfully" });
});
userrouter.get("/profile", auth, async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
});
export default userrouter;
