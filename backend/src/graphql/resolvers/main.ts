import { userResolvers } from "./users";
import { postResolvers } from "./posts";
import { mergeResolvers } from "@graphql-tools/merge";

export const resolvers = mergeResolvers([userResolvers, postResolvers]);
