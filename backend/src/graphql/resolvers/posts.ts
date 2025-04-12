import { AuthenticationError, UserInputError } from "apollo-server-express";
// Change the import to use the generated Prisma client from the local directory
import { PrismaClient } from "../../generated/prisma";

interface Context {
  prisma: PrismaClient;
  user?: { id: number };
}

export const postResolvers = {
  Query: {
    post: async (_: any, { id }: { id: number }, { prisma }: Context) => {
      return prisma.post.findUnique({
        where: { id },
      });
    },
    posts: async (_: any, __: any, { prisma }: Context) => {
      return prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    },
    feed: async (_: any, __: any, { prisma, user }: Context) => {
      if (!user) {
        throw new AuthenticationError("You must be logged in");
      }

      // Get users that the current user is following
      const following = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true },
      });

      const followingIds = following.map(
        (f: { followingId: any }) => f.followingId
      );

      // Get posts from followed users and the user's own posts
      return prisma.post.findMany({
        where: {
          OR: [{ authorId: { in: followingIds } }, { authorId: user.id }],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    },
  },
  Mutation: {
    createPost: async (
      _: any,
      { input }: { input: { content: string } },
      { prisma, user }: Context
    ) => {
      if (!user) {
        throw new AuthenticationError("You must be logged in");
      }

      return prisma.post.create({
        data: {
          content: input.content,
          authorId: user.id,
        },
      });
    },
    deletePost: async (
      _: any,
      { id }: { id: number },
      { prisma, user }: Context
    ) => {
      if (!user) {
        throw new AuthenticationError("You must be logged in");
      }

      const post = await prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new UserInputError("Post not found");
      }

      if (post.authorId !== user.id) {
        throw new AuthenticationError("Not authorized");
      }

      await prisma.post.delete({
        where: { id },
      });

      return true;
    },
    likePost: async (
      _: any,
      { id }: { id: number },
      { prisma, user }: Context
    ) => {
      if (!user) {
        throw new AuthenticationError("You must be logged in");
      }

      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new UserInputError("Post not found");
      }

      // Check if already liked
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: id,
          },
        },
      });

      if (existingLike) {
        return {
          success: true,
          message: "Already liked this post",
          isLiked: true,
        };
      }

      // Create like
      await prisma.like.create({
        data: {
          userId: user.id,
          postId: id,
        },
      });

      return {
        success: true,
        message: "Successfully liked post",
        isLiked: true,
      };
    },
    unlikePost: async (
      _: any,
      { id }: { id: number },
      { prisma, user }: Context
    ) => {
      if (!user) {
        throw new AuthenticationError("You must be logged in");
      }

      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new UserInputError("Post not found");
      }

      // Check if liked
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: id,
          },
        },
      });

      if (!existingLike) {
        return {
          success: true,
          message: "Post is not liked",
          isLiked: false,
        };
      }

      // Delete like
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: user.id,
            postId: id,
          },
        },
      });

      return {
        success: true,
        message: "Successfully unliked post",
        isLiked: false,
      };
    },
  },
  Post: {
    author: async (parent: any, _: any, { prisma }: Context) => {
      return prisma.user.findUnique({
        where: { id: parent.authorId },
      });
    },
    likesCount: async (parent: any, _: any, { prisma }: Context) => {
      return prisma.like.count({
        where: { postId: parent.id },
      });
    },
    isLiked: async (parent: any, _: any, { prisma, user }: Context) => {
      if (!user) {
        return null;
      }

      const like = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: parent.id,
          },
        },
      });

      return !!like;
    },
  },
};
