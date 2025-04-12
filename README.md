# GomArey Social Media API

A modern social media GraphQL API built with Node.js, Express, Apollo Server, and Prisma.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Posts](#posts)
  - [Follows](#follows)
  - [Likes](#likes)
- [Example Queries and Mutations](#example-queries-and-mutations)
- [Frontend Integration](#frontend-integration)
- [Deployment](#deployment)

## Overview

GomArey is a full-featured social media API that enables developers to build social networking applications. It provides functionality for user authentication, posting content, following users, and liking posts.

The API is built with:

- **Node.js** and **Express** for the server
- **Apollo Server** for GraphQL implementation
- **Prisma ORM** for database operations
- **PostgreSQL** database for data storage
- **JWT** for authentication

## Features

- **User Management**: Register, login, and profile management
- **Post Management**: Create, read, and delete posts
- **Social Network**: Follow/unfollow users, view followers and following
- **Engagement**: Like/unlike posts
- **Feed**: Personalized content feed from followed users

## Project Structure

The project is organized into two main parts:

### Backend

```
backend/
  ├── prisma/                # Prisma schema and migrations
  ├── src/
  │   ├── generated/        # Generated Prisma client
  │   ├── graphql/
  │   │   ├── resolvers/     # GraphQL resolvers for each entity
  │   │   │   ├── main.ts    # Combines all resolvers
  │   │   │   ├── users.ts   # User-related resolvers
  │   │   │   └── posts.ts   # Post-related resolvers
  │   │   ├── typeDefs/      # GraphQL type definitions
  │   │   │   ├── main.ts    # Combines all type definitions
  │   │   │   ├── users.ts   # User-related types
  │   │   │   └── posts.ts   # Post-related types
  │   │   └── schema.ts      # GraphQL schema configuration
  │   ├── middleware/        # Express middleware
  │   │   └── auth.ts        # Authentication middleware
  │   ├── utils/             # Utility functions
  │   │   └── logger.ts      # Logging functionality
  │   └── index.ts           # Application entry point
  └── package.json           # Project dependencies
```

### Frontend

```
frontend/
  ├── src/
  │   ├── components/        # React components
  │   ├── pages/             # React pages
  │   └── graphql/           # GraphQL queries and mutations
  ├── public/                # Static files
  └── package.json           # Project dependencies
```

## Setup and Installation

### Prerequisites

- Node.js v14+ and npm/pnpm
- PostgreSQL database

### Backend Setup

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd gomarey
   ```

2. Install dependencies

   ```bash
   cd backend
   pnpm install
   ```

3. Set up environment variables

   ```
   # Create .env file
   DATABASE_URL="postgresql://username:password@localhost:5432/gomarey"
   JWT_SECRET="your-jwt-secret"
   ```

4. Run database migrations

   ```bash
   npx prisma migrate dev
   ```

5. Start the server
   ```bash
   pnpm dev
   ```

Server will be available at http://localhost:4000/graphql

### Frontend Setup

1. Install dependencies

   ```bash
   cd frontend
   pnpm install
   ```

2. Start the development server
   ```bash
   pnpm dev
   ```

Frontend will be available at http://localhost:5173

## Database Schema

The application uses the following database schema:

### User Model

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  username  String   @unique
  password  String
  name      String?
  bio       String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  followers Follow[] @relation("follower")
  following Follow[] @relation("following")
  likes     Like[]
  posts     Post[]
}
```

### Post Model

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  authorId  Int
  likes     Like[]
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
}
```

### Like Model

```prisma
model Like {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  userId    Int
  postId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
}
```

### Follow Model

```prisma
model Follow {
  followerId  Int
  followingId Int
  follower    User @relation("follower", fields: [followerId], references: [id], onDelete: Cascade)
  following   User @relation("following", fields: [followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
  @@unique([followerId, followingId])
}
```

## API Documentation

### Authentication

#### Register User

**Mutation:**

```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    token
    user {
      id
      username
      email
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "email": "user@example.com",
    "username": "username",
    "password": "password123",
    "name": "User Name"
  }
}
```

#### Login User

**Mutation:**

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user {
      id
      username
      email
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

**Note:** After login or registration, include the token in subsequent requests as an HTTP header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Users

#### Get Current User Profile

**Query:**

```graphql
query Me {
  me {
    id
    username
    email
    name
    bio
    followersCount
    followingCount
    posts {
      id
      content
      createdAt
    }
  }
}
```

#### Get User by Username

**Query:**

```graphql
query GetUser($username: String!) {
  user(username: $username) {
    id
    username
    name
    bio
    followersCount
    followingCount
    isFollowing
    posts {
      id
      content
      createdAt
      likesCount
    }
  }
}
```

**Variables:**

```json
{
  "username": "username"
}
```

#### Search Users

**Query:**

```graphql
query SearchUsers($query: String) {
  users(query: $query) {
    id
    username
    name
    followersCount
    followingCount
  }
}
```

**Variables:**

```json
{
  "query": "search_term"
}
```

#### Update Profile

**Mutation:**

```graphql
mutation UpdateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    id
    name
    bio
  }
}
```

**Variables:**

```json
{
  "input": {
    "name": "New Name",
    "bio": "My new bio description"
  }
}
```

#### Get User Followers

**Query:**

```graphql
query GetFollowers($userId: Int!) {
  followers(userId: $userId) {
    id
    username
    name
  }
}
```

**Variables:**

```json
{
  "userId": 1
}
```

#### Get User Following

**Query:**

```graphql
query GetFollowing($userId: Int!) {
  following(userId: $userId) {
    id
    username
    name
  }
}
```

**Variables:**

```json
{
  "userId": 1
}
```

### Posts

#### Create Post

**Mutation:**

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    content
    createdAt
    author {
      id
      username
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "content": "This is my new post!"
  }
}
```

#### Get Posts

**Query:**

```graphql
query GetPosts {
  posts {
    id
    content
    createdAt
    author {
      id
      username
    }
    likesCount
    isLiked
  }
}
```

#### Get Single Post

**Query:**

```graphql
query GetPost($id: Int!) {
  post(id: $id) {
    id
    content
    createdAt
    author {
      id
      username
      name
    }
    likesCount
    isLiked
  }
}
```

**Variables:**

```json
{
  "id": 1
}
```

#### Get User Feed

**Query:**

```graphql
query GetFeed {
  feed {
    id
    content
    createdAt
    author {
      id
      username
    }
    likesCount
    isLiked
  }
}
```

#### Delete Post

**Mutation:**

```graphql
mutation DeletePost($id: Int!) {
  deletePost(id: $id)
}
```

**Variables:**

```json
{
  "id": 1
}
```

### Follows

#### Follow User

**Mutation:**

```graphql
mutation FollowUser($userId: Int!) {
  followUser(userId: $userId) {
    success
    message
    isFollowing
  }
}
```

**Variables:**

```json
{
  "userId": 2
}
```

#### Unfollow User

**Mutation:**

```graphql
mutation UnfollowUser($userId: Int!) {
  unfollowUser(userId: $userId) {
    success
    message
    isFollowing
  }
}
```

**Variables:**

```json
{
  "userId": 2
}
```

### Likes

#### Like Post

**Mutation:**

```graphql
mutation LikePost($id: Int!) {
  likePost(id: $id) {
    success
    message
    isLiked
  }
}
```

**Variables:**

```json
{
  "id": 1
}
```

#### Unlike Post

**Mutation:**

```graphql
mutation UnlikePost($id: Int!) {
  unlikePost(id: $id) {
    success
    message
    isLiked
  }
}
```

**Variables:**

```json
{
  "id": 1
}
```

## Example Queries and Mutations

### User Authentication Flow

1. **Register a new user**
2. **Login with user credentials**
3. **Use the returned token for authenticated requests**

### Social Media Flow

1. **Create a new post**
2. **Browse all posts or get personalized feed**
3. **Like posts of interest**
4. **Search for other users**
5. **Follow users to see their content in your feed**
6. **Check followers and following list**

## Frontend Integration

The frontend application can connect to this API using Apollo Client. Here's an example of setting up Apollo Client in a React application:

```javascript
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloProvider,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// HTTP connection to the API
const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
});

// Auth middleware
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Create the Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

// Wrap your React app with ApolloProvider
function App() {
  return (
    <ApolloProvider client={client}>
      {/* Your application components */}
    </ApolloProvider>
  );
}
```

## Deployment

### Backend Deployment

The backend can be deployed to various platforms:

#### Heroku

1. Create a new Heroku app
2. Set up environment variables in the Heroku dashboard
3. Connect your repository to Heroku
4. Deploy the application

#### Docker

1. Use the provided Dockerfile
2. Build the Docker image
3. Deploy to a container orchestration platform

### Frontend Deployment

The frontend can be deployed to:

- Vercel
- Netlify
- GitHub Pages
- AWS Amplify

Remember to update the GraphQL endpoint URL in your frontend application to point to your deployed backend API.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
