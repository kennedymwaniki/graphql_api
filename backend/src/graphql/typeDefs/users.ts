import { gql } from "apollo-server-express";

export const userTypeDefs = gql`
  type User {
    id: Int!
    email: String!
    username: String!
    name: String
    bio: String
    createdAt: String!
    updatedAt: String!
    posts: [Post!]!
    followersCount: Int!
    followingCount: Int!
    isFollowing: Boolean
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type FollowResult {
    success: Boolean!
    message: String!
    isFollowing: Boolean!
  }

  input RegisterInput {
    email: String!
    username: String!
    password: String!
    name: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateProfileInput {
    name: String
    bio: String
  }

  type Query {
    me: User
    user(username: String!): User
    users(query: String): [User!]!
    followers(userId: Int!): [User!]!
    following(userId: Int!): [User!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    updateProfile(input: UpdateProfileInput!): User!
    followUser(userId: Int!): FollowResult!
    unfollowUser(userId: Int!): FollowResult!
  }
`;
