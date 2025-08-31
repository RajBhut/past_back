import { Router } from "express";
import { auth } from "./user.routes.js";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
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
        description: true,
        language: true,
        tags: true,
        authorId: true,
        burnAfterRead: true,
        views: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
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

postrouter.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Search query is required" });
  try {
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
          {
            description: {
              contains: q,
              mode: "insensitive",
            },
          },
          { tags: { hasSome: [q] || [] } },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error searching posts", error: error.message });
  }
});

postrouter.get("/upvotes/data/:pId", auth, async (req, res) => {
  const { pId } = req.params;
  const postId = Number(pId);
  const userId = req.user.id;

  try {
    const upvotecount = await prisma.upvote.count({
      where: { postId },
    });

    const userupvote = await prisma.upvote.findFirst({
      where: { postId, userId },
    });
    res.header("Access-Control-Allow-Origin", `${process.env.Frontend_URL}`);
    res.header("Access-Control-Allow-Credentials", "true");
    if (!userupvote) {
      return res.json({ upvotecount, userupvote: false });
    } else res.json({ upvotecount, userupvote: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
});
postrouter.post("/", auth, async (req, res) => {
  const { title, content, description, language, tags, userId, authorId, bar } =
    req.body;

  try {
    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        description: description || "",
        language: language || "javascript",
        tags: tags || [],
        burnAfterRead: bar || false,

        author: {
          connect: {
            id: userId,
          },
        },
      },
    });
    const options = {
      method: "POST",
      url: "https://api.link.nxog.tech/v1/link",
      headers: {
        Authorization: `Bearer ${process.env.LINKER_API}`,
        "Content-Type": "application/json",
      },
      data: {
        title: newPost.title,
        url: `${process.env.Frontend_URL}/page/${newPost.id}`,
        createAccessToken: true,
      },
    };
    let linkid = "";
    let accesstockenid = "";
    let accesstocken = "";
    try {
      const { data } = await axios.request(options);

      linkid = data.data.id;
      accesstocken = data.data.accessToken.token;
      accesstockenid = data.data.accessToken.id;
    } catch (error) {
      console.error(error);
    }

    const updatedpost = await prisma.post.update({
      where: {
        id: newPost.id,
      },
      data: {
        linkId: linkid,
        accessId: accesstockenid,
        accesstocken: accesstocken,
      },
    });
    res.json(updatedpost);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error creating post", error: error.message });
  }
});

postrouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (post) {
      await prisma.post.update({
        where: { id: Number(id) },
        data: { views: { increment: 1 } },
      });

      if (post.burnAfterRead) {
        await prisma.post.delete({
          where: {
            id: post.id,
          },
        });
        // Remove author info for burned posts for security
        const { author, ...postWithoutAuthor } = post;
        res.json(postWithoutAuthor);
      } else {
        res.json(post);
      }
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching post", error: error.message });
  }
});

postrouter.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { title, content, description, language, tags } = req.body;
  const userId = req.user.id;

  try {
    const existingPost = await prisma.post.findUnique({
      where: { id: Number(id) },
      select: { authorId: true },
    });

    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (existingPost.authorId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this post" });
    }

    const post = await prisma.post.update({
      where: {
        id: Number(id),
      },
      data: {
        title: title || undefined,
        content: content || undefined,
        description: description || undefined,
        language: language || undefined,
        tags: tags || undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
    res.json(post);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error updating post", error: error.message });
  }
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

postrouter.get("/upvotes/data/:id", auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const upvotecount = await prisma.upvote.count({
      where: { postId: Number(id) },
    });

    const userupvote = await prisma.upvote.findFirst({
      where: { postId: Number(id), userId: Number(userId) },
    });

    res.json({
      upvotecount,
      userupvote: !!userupvote,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching upvote data", error: error.message });
  }
});

export default postrouter;
