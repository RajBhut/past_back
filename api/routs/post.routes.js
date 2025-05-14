// import { Router } from "express";
// import { auth } from "./user.routes.js";
// import { PrismaClient } from "@prisma/client";
// import axios from "axios";
// const postrouter = Router();
// const prisma = new PrismaClient();

// postrouter.get("/", async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;

//   try {
//     const totalPosts = await prisma.post.count();
//     const posts = await prisma.post.findMany({
//       select: {
//         id: true,
//         title: true,
//         authorId: true,
//         burnAfterRead: true,
//         createdAt: true,
//       },
//       skip: skip,
//       take: limit,
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     res.json({
//       posts,
//       currentPage: page,
//       totalPages: Math.ceil(totalPosts / limit),
//       totalPosts,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching posts", error: error.message });
//   }
// });
// postrouter.post("/upvote", auth, async (req, res) => {
//   const { postId, userId } = req.body;

//   try {
//     const post = await prisma.post.findUnique({
//       where: { id: postId },
//     });

//     if (!post) return res.status(404).json({ message: "Post not found" });

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) return res.status(404).json({ message: "User not found" });

//     const upvote = await prisma.upvote.findFirst({
//       where: { postId, userId },
//     });

//     if (upvote) {
//       await prisma.upvote.delete({
//         where: { id: upvote.id },
//       });
//       return res.json({ message: "Upvote removed" });
//     } else {
//       await prisma.upvote.create({
//         data: {
//           Post: { connect: { id: postId } },
//           User: { connect: { id: userId } },
//         },
//       });
//       return res.json({ message: "Upvoted" });
//     }
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// });
// postrouter.get("/upvotes/data/:pId", auth, async (req, res) => {
//   const { pId } = req.params;
//   const postId = Number(pId);
//   const userId = req.user.id;

//   try {
//     const upvotecount = await prisma.upvote.count({
//       where: { postId },
//     });

//     const userupvote = await prisma.upvote.findFirst({
//       where: { postId, userId },
//     });
//     res.header("Access-Control-Allow-Origin", `${process.env.Frontend_URL}`);
//     res.header("Access-Control-Allow-Credentials", "true");
//     if (!userupvote) {
//       return res.json({ upvotecount, userupvote: false });
//     } else res.json({ upvotecount, userupvote: true });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// });
// postrouter.post("/", auth, async (req, res) => {
//   const { title, content, userId, authorId, bar } = req.body;

//   const newPost = await prisma.post.create({
//     data: {
//       title,
//       content,
//       burnAfterRead: bar,

//       author: {
//         connect: {
//           id: userId,
//         },
//       },
//     },
//   });
//   const options = {
//     method: "POST",
//     url: "https://api.link.nxog.tech/v1/link",
//     headers: {
//       Authorization: `Bearer ${process.env.LINKER_API}`,
//       "Content-Type": "application/json",
//     },
//     data: {
//       title: newPost.title,
//       url: `${process.env.Frontend_URL}/page/${newPost.id}`,
//       createAccessToken: true,
//     },
//   };
//   let linkid = "";
//   let accesstockenid = "";
//   let accesstocken = "";
//   try {
//     const { data } = await axios.request(options);

//     linkid = data.data.id;
//     accesstocken = data.data.accessToken.token;
//     accesstockenid = data.data.accessToken.id;
//   } catch (error) {
//     console.error(error);
//   }

//   const updatedpost = await prisma.post.update({
//     where: {
//       id: newPost.id,
//     },
//     data: {
//       linkId: linkid,
//       accessId: accesstockenid,
//       accesstocken: accesstocken,
//     },
//   });
//   res.json(updatedpost);
// });

// postrouter.get("/:id", async (req, res) => {
//   const { id } = req.params;
//   const post = await prisma.post.findUnique({
//     where: {
//       id: Number(id),
//     },
//   });
//   if (post) {
//     if (post.burnAfterRead) {
//       await prisma.post.delete({
//         where: {
//           id: post.id,
//         },
//       });
//     }
//     res.json(post);
//   } else {
//     res.status(404).json({ message: "Post not found" });
//   }
// });

// postrouter.put("/:id", async (req, res) => {
//   const { id } = req.params;
//   const { title, content } = req.body;
//   const post = await prisma.post.update({
//     where: {
//       id: Number(id),
//     },
//     data: {
//       title,
//       content,
//     },
//   });
//   res.json(post);
// });

// postrouter.delete("/:id", auth, async (req, res) => {
//   const { id } = req.params;
//   const { userId, single_post } = req.body;

//   try {
//     if (userId != single_post.authorId) {
//       return res
//         .status(401)
//         .json({ message: "You are not authorized to delete this post" });
//     }

//     const post = await prisma.post.delete({
//       where: {
//         id: Number(id),
//       },
//     });

//     return res.json(post);
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Something went wrong", error: error.message });
//   }
// });

// export default postrouter;
import { Router } from "express";
import { auth } from "./user.routes.js";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
const postrouter = Router();

// Create a single PrismaClient instance with connection pooling
const prisma = new PrismaClient({
  // Configure connection pooling for better performance
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // // Increase connection pool size for better concurrency
  // connectionLimit: 20,
});

// Cache for storing frequently accessed data
const cache = {
  posts: new Map(),
  upvotes: new Map(),
  ttl: 60 * 1000, // 1 minute cache TTL
  clear: function (key) {
    if (key) {
      this.posts.delete(key);
      this.upvotes.delete(key);
    }
  },
};

// Middleware to handle common errors
const errorHandler = (res, error, message = "Something went wrong") => {
  console.error(error);
  return res.status(500).json({ message, error: error.message });
};

// Get all posts with pagination and caching
postrouter.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const cacheKey = `posts_${page}_${limit}`;

  try {
    // Check cache first
    if (cache.posts.has(cacheKey)) {
      const cachedData = cache.posts.get(cacheKey);
      if (Date.now() - cachedData.timestamp < cache.ttl) {
        return res.json(cachedData.data);
      }
    }

    // Use Promise.all for parallel queries for better performance
    const [totalPosts, posts] = await Promise.all([
      prisma.post.count(),
      prisma.post.findMany({
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
      }),
    ]);

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    };

    // Store in cache
    cache.posts.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    res.json(result);
  } catch (error) {
    errorHandler(res, error, "Error fetching posts");
  }
});

// Upvote a post
postrouter.post("/upvote", auth, async (req, res) => {
  const { postId, userId } = req.body;

  try {
    // Use transaction for data integrity
    const result = await prisma.$transaction(async (tx) => {
      // Check if post and user exist in a single query
      const [post, user, upvote] = await Promise.all([
        tx.post.findUnique({ where: { id: postId } }),
        tx.user.findUnique({ where: { id: userId } }),
        tx.upvote.findFirst({ where: { postId, userId } }),
      ]);

      if (!post) return { status: 404, message: "Post not found" };
      if (!user) return { status: 404, message: "User not found" };

      // Clear related caches
      cache.clear(`upvotes_${postId}_${userId}`);
      cache.clear(`upvotes_data_${postId}`);

      if (upvote) {
        await tx.upvote.delete({ where: { id: upvote.id } });
        return { status: 200, message: "Upvote removed" };
      } else {
        await tx.upvote.create({
          data: {
            Post: { connect: { id: postId } },
            User: { connect: { id: userId } },
          },
        });
        return { status: 200, message: "Upvoted" };
      }
    });

    return res.status(result.status).json({ message: result.message });
  } catch (error) {
    errorHandler(res, error);
  }
});

// Get upvote data for a post
postrouter.get("/upvotes/data/:pId", auth, async (req, res) => {
  const { pId } = req.params;
  const postId = Number(pId);
  const userId = req.user.id;
  const cacheKey = `upvotes_data_${postId}_${userId}`;

  try {
    // Check cache first
    if (cache.upvotes.has(cacheKey)) {
      const cachedData = cache.upvotes.get(cacheKey);
      if (Date.now() - cachedData.timestamp < cache.ttl) {
        return res.json(cachedData.data);
      }
    }

    // Use Promise.all for parallel queries
    const [upvotecount, userupvote] = await Promise.all([
      prisma.upvote.count({ where: { postId } }),
      prisma.upvote.findFirst({ where: { postId, userId } }),
    ]);

    const result = {
      upvotecount,
      userupvote: !!userupvote,
    };

    // Store in cache
    cache.upvotes.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    res.header("Access-Control-Allow-Origin", `${process.env.Frontend_URL}`);
    res.header("Access-Control-Allow-Credentials", "true");
    res.json(result);
  } catch (error) {
    errorHandler(res, error);
  }
});

// Create a new post
postrouter.post("/", auth, async (req, res) => {
  const { title, content, userId, bar } = req.body;

  try {
    // Use transaction for atomicity
    const newPost = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
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

      const options = {
        method: "POST",
        url: "https://api.link.nxog.tech/v1/link",
        headers: {
          Authorization: `Bearer ${process.env.LINKER_API}`,
          "Content-Type": "application/json",
        },
        data: {
          title: post.title,
          url: `${process.env.Frontend_URL}/page/${post.id}`,
          createAccessToken: true,
        },
        timeout: 5000, // Add timeout to prevent hanging requests
      };

      try {
        const { data } = await axios.request(options);

        // Update the post with link data
        return await tx.post.update({
          where: { id: post.id },
          data: {
            linkId: data.data.id,
            accessId: data.data.accessToken.id,
            accesstocken: data.data.accessToken.token,
          },
        });
      } catch (axiosError) {
        console.error("API request failed:", axiosError.message);
        // Return the post even if API call fails
        return post;
      }
    });

    // Clear related caches
    cache.posts.clear();

    res.json(newPost);
  } catch (error) {
    errorHandler(res, error, "Error creating post");
  }
});

// Get a single post by ID
postrouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  const postId = Number(id);
  const cacheKey = `post_${postId}`;

  try {
    // Check cache first (except for burnAfterRead posts)
    if (cache.posts.has(cacheKey)) {
      const cachedData = cache.posts.get(cacheKey);
      if (
        Date.now() - cachedData.timestamp < cache.ttl &&
        !cachedData.data.burnAfterRead
      ) {
        return res.json(cachedData.data);
      }
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Handle burn after read
    if (post.burnAfterRead) {
      await prisma.post.delete({
        where: { id: post.id },
      });
      // Clear all caches related to this post
      cache.posts.forEach((value, key) => {
        if (key.includes(`post_${post.id}`) || key.startsWith("posts_")) {
          cache.posts.delete(key);
        }
      });
      cache.upvotes.forEach((value, key) => {
        if (key.includes(`${post.id}`)) {
          cache.upvotes.delete(key);
        }
      });
    } else {
      // Cache the post if it's not burn after read
      cache.posts.set(cacheKey, {
        data: post,
        timestamp: Date.now(),
      });
    }

    res.json(post);
  } catch (error) {
    errorHandler(res, error, "Error fetching post");
  }
});

// Update a post
postrouter.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { title, content, userId } = req.body;
  const postId = Number(id);

  try {
    // First check if the user is authorized to update the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.authorId !== userId) {
      return res.status(401).json({
        message: "You are not authorized to update this post",
      });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { title, content },
    });

    // Clear all caches related to this post
    cache.clear(`post_${postId}`);
    cache.posts.forEach((value, key) => {
      if (key.startsWith("posts_")) {
        cache.posts.delete(key);
      }
    });

    res.json(updatedPost);
  } catch (error) {
    errorHandler(res, error, "Error updating post");
  }
});

// Delete a post
postrouter.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { userId, single_post } = req.body;
  const postId = Number(id);

  try {
    if (userId !== single_post.authorId) {
      return res.status(401).json({
        message: "You are not authorized to delete this post",
      });
    }

    const post = await prisma.post.delete({
      where: { id: postId },
    });

    // Clear all caches
    cache.posts.forEach((value, key) => {
      if (key.includes(`post_${postId}`) || key.startsWith("posts_")) {
        cache.posts.delete(key);
      }
    });
    cache.upvotes.forEach((value, key) => {
      if (key.includes(`${postId}`)) {
        cache.upvotes.delete(key);
      }
    });

    return res.json(post);
  } catch (error) {
    errorHandler(res, error);
  }
});

// Add a cache clearing endpoint for admin use
postrouter.post("/admin/clear-cache", auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Clear all caches
    cache.posts.clear();
    cache.upvotes.clear();

    res.json({ message: "Cache cleared successfully" });
  } catch (error) {
    errorHandler(res, error);
  }
});

export default postrouter;
