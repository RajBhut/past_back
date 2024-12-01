import { Router } from "express";
import { auth } from "./user.routes.js";
import { PrismaClient } from "@prisma/client";
const postrouter = Router();
const prisma = new PrismaClient();

postrouter.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const totalPosts = await prisma.post.count();
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        authorId: true,
        burnAfterRead: true,
        createdAt: true,
      },
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching posts", error: error.message });
  }
});
postrouter.post("/upvote", auth, async (req, res) => {
  const { postId, userId } = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const upvote = await prisma.upvote.findFirst({
      where: { postId, userId },
    });

    if (upvote) {
      await prisma.upvote.delete({
        where: { id: upvote.id },
      });
      return res.json({ message: "Upvote removed" });
    } else {
      await prisma.upvote.create({
        data: {
          Post: { connect: { id: postId } },
          User: { connect: { id: userId } },
        },
      });
      return res.json({ message: "Upvoted" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
});
postrouter.get("/upvotes/data", auth, async (req, res) => {
  const { postId, userId } = req.body;
  try {
    const upvotecount = await prisma.upvote.count({
      where: { postId },
    });
    const userupvote = await prisma.upvote.findFirst({
      where: { postId, userId },
    });
    if (!userupvote) {
      return res.json({ upvotecount, userupvote: false });
    } else res.json({ upvotecount, userupvote });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
});
postrouter.post("/", auth, async (req, res) => {
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

postrouter.delete("/:id", auth, async (req, res) => {
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
