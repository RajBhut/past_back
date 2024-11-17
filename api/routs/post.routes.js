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
      burnAfterRead: true,
    },
  });
  res.json(allPosts);
});

postrouter.post("/", async (req, res) => {
  const { title, content, userId, authorId, bar } = req.body;

  const newPost = await prisma.post.create({
    data: {
      title,
      content,
      burnAfterRead: bar,

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
    if (post.burnAfterRead) {
      await prisma.post.delete({
        where: {
          id: post.id,
        },
      });
    }
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
  const { userId, single_post } = req.body;

  try {
    if (userId != single_post.authorId) {
      return res
        .status(401)
        .json({ message: "You are not authorized to delete this post" });
    }

    const post = await prisma.post.delete({
      where: {
        id: Number(id),
      },
    });

    return res.json(post);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
});

export default postrouter;
