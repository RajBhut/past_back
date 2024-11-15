import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const postrouter = Router();
const prisma = new PrismaClient();

postrouter.get("/", async (req, res) => {
  const allPosts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      authorId: true,
    },
  });
  res.json(allPosts);
});

postrouter.post("/", async (req, res) => {
  const { title, content, userId, authorId } = req.body;

  const newPost = await prisma.post.create({
    data: {
      title,
      content,

      author: {
        connect: {
          id: userId,
        },
      },
    },
  });
  res.json(newPost);
});

postrouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  const post = await prisma.post.findUnique({
    where: {
      id: Number(id),
    },
  });
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ message: "Post not found" });
  }
});

postrouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const post = await prisma.post.update({
    where: {
      id: Number(id),
    },
    data: {
      title,
      content,
    },
  });
  res.json(post);
});

postrouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (userId !== id) {
    res
      .status(401)
      .json({ message: "You are not authorized to delete this post" });
  }
  const post = await prisma.post.delete({
    where: {
      id: Number(id),
    },
  });
  res.json(post);
});

export default postrouter;
