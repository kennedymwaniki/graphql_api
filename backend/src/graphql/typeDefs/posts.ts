export const postTypeDefs = `
  type Post {
    id: Int!
    content: String!
    createdAt: String!
    updatedAt: String!
    author: User!
    likesCount: Int!
    isLiked: Boolean
  }

  type LikeResult {
    success: Boolean!
    message: String!
    isLiked: Boolean!
  }

  input CreatePostInput {
    content: String!
  }

  type Query {
    post(id: Int!): Post
    posts: [Post!]!
    feed: [Post!]!
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post!
    deletePost(id: Int!): Boolean!
    likePost(id: Int!): LikeResult!
    unlikePost(id: Int!): LikeResult!
  }
`;
