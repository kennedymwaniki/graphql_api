import { AuthenticationError, UserInputError } from "apollo-server-express";
// Update the import to use the locally generated Prisma client
import { PrismaClient } from "../../generated/prisma";
import { generateToken, hashPassword, comparePasswords } from "../../utils";

interface Context {
  prisma: PrismaClient;
  user?: { id: number };
}

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, { prisma, user }: Context) => {
      console.log("Me query called for user:", user?.id);

      if (!user) {
        console.log("Me query failed: No authenticated user");
        return null;
      }

      const userData = await prisma.user.findUnique({
        where: { id: user.id },
      });

      console.log(
        "Me query result:",
        userData ? "User found" : "User not found"
      );
      return userData;
    },
    user: async (
      _: any,
      { username }: { username: string },
      { prisma }: Context
    ) => {
      console.log("User query called for username:", username);

      const foundUser = await prisma.user.findUnique({
        where: { username },
      });

      if (!foundUser) {
        console.log("User query failed: User not found");
        throw new UserInputError("User not found");
      }

      console.log("User query successful for:", username);
      return foundUser;
    },
    users: async (
      _: any,
      { query }: { query?: string },
      { prisma }: Context
    ) => {
      console.log("Users query called with search:", query || "none");

      let users;
      if (query) {
        users = await prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 20,
        });
      } else {
        users = await prisma.user.findMany({ take: 20 });
      }

      console.log(`Users query returned ${users.length} results`);
      return users;
    },
    followers: async (
      _: any,
      { userId }: { userId: number },
      { prisma }: Context
    ) => {
      console.log("Followers query called for user ID:", userId);

      const follows = await prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: true },
      });

      console.log(`Found ${follows.length} followers for user ID ${userId}`);
      return follows.map((follow: { follower: any }) => follow.follower);
    },
    following: async (
      _: any,
      { userId }: { userId: number },
      { prisma }: Context
    ) => {
      console.log("Following query called for user ID:", userId);

      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: true },
      });

      console.log(`Found ${follows.length} followings for user ID ${userId}`);
      return follows.map((follow: { following: any }) => follow.following);
    },
  },
  Mutation: {
    register: async (
      _: any,
      {
        input,
      }: {
        input: {
          email: string;
          username: string;
          password: string;
          name?: string;
        };
      },
      { prisma }: Context
    ) => {
      console.log("Register mutation called with input:", {
        ...input,
        password: "[REDACTED]",
      });

      // Check if email or username already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: input.email }, { username: input.username }],
        },
      });

      if (existingUser) {
        console.log("Registration failed: Email or username already taken");
        throw new UserInputError("Email or username already taken");
      }

      // Hash password
      const hashedPassword = await hashPassword(input.password);

      // Create new user
      const user = await prisma.user.create({
        data: {
          email: input.email,
          username: input.username,
          password: hashedPassword,
          name: input.name || input.username,
        },
      });

      console.log(
        `User registered successfully: ID ${user.id}, username: ${user.username}`
      );

      // Generate JWT token
      const token = generateToken(user.id);

      return {
        token,
        user,
      };
    },
    login: async (
      _: any,
      { input }: { input: { email: string; password: string } },
      { prisma }: Context
    ) => {
      console.log("Login attempt for email:", input.email);

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        console.log("Login failed: User not found");
        throw new AuthenticationError("Invalid credentials");
      }

      // Verify password
      const validPassword = await comparePasswords(
        input.password,
        user.password
      );

      if (!validPassword) {
        console.log("Login failed: Invalid password");
        throw new AuthenticationError("Invalid credentials");
      }

      console.log(
        `Login successful: ID ${user.id}, username: ${user.username}`
      );

      // Generate JWT token
      const token = generateToken(user.id);

      return {
        token,
        user,
      };
    },
    updateProfile: async (
      _: any,
      { input }: { input: { name?: string; bio?: string } },
      { prisma, user }: Context
    ) => {
      if (!user) {
        throw new AuthenticationError("You must be logged in");
      }

      return prisma.user.update({
        where: { id: user.id },
        data: {
          name: input.name !== undefined ? input.name : undefined,
          bio: input.bio !== undefined ? input.bio : undefined,
        },
      });
    },
    followUser: async (
      _: any,
      { userId }: { userId: number },
      { prisma, user }: Context
    ) => {
      if (!user) {
        throw new AuthenticationError("You must be logged in");
      }

      if (user.id === userId) {
        throw new UserInputError("You cannot follow yourself");
      }

      const userToFollow = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userToFollow) {
        throw new UserInputError("User not found");
      }

      // Check if already following
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: userId,
          },
        },
      });

      if (existingFollow) {
        return {
          success: true,
          message: "Already following this user",
          isFollowing: true,
        };
      }

      // Create follow relationship
      await prisma.follow.create({
        data: {
          followerId: user.id,
          followingId: userId,
        },
      });

      return {
        success: true,
        message: "Successfully followed user",
        isFollowing: true,
      };
    },
    unfollowUser: async (
      _: any,
      { userId }: { userId: number },
      { prisma, user }: Context
    ) => {
      if (!user) {
        throw new AuthenticationError("You must be logged in");
      }

      const userToUnfollow = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userToUnfollow) {
        throw new UserInputError("User not found");
      }

      // Check if following
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: userId,
          },
        },
      });

      if (!existingFollow) {
        return {
          success: true,
          message: "Not following this user",
          isFollowing: false,
        };
      }

      // Delete follow relationship
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: userId,
          },
        },
      });

      return {
        success: true,
        message: "Successfully unfollowed user",
        isFollowing: false,
      };
    },
  },
  User: {
    posts: async (parent: any, _: any, { prisma }: Context) => {
      return prisma.post.findMany({
        where: { authorId: parent.id },
        orderBy: { createdAt: "desc" },
      });
    },
    followersCount: async (parent: any, _: any, { prisma }: Context) => {
      return prisma.follow.count({
        where: { followingId: parent.id },
      });
    },
    followingCount: async (parent: any, _: any, { prisma }: Context) => {
      return prisma.follow.count({
        where: { followerId: parent.id },
      });
    },
    isFollowing: async (parent: any, _: any, { prisma, user }: Context) => {
      if (!user) {
        return null;
      }

      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: parent.id,
          },
        },
      });

      return !!follow;
    },
  },
};
