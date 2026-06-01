import { relations } from "drizzle-orm";
import { posts } from "../post";
import { postVotes } from "../vote";
import { comments } from "../comment";
import { postLikes } from "../post-like";
 

// Votes → Post

export const postVotesRelations = relations(postVotes, ({ one }) => ({

  post: one(posts, {

    fields: [postVotes.postId],

    references: [posts.id],

  }),

}));

// post 
export const postsRelations = relations(posts, ({ many }) => ({

  comments: many(comments),

  votes: many(postVotes),

  likes: many(postLikes),

}));


// commentsRelations
export const commentsRelations = relations(comments, ({ one }) => ({

  post: one(posts, {

    fields: [comments.postId],

    references: [posts.id],

  }),

}));

 // likes 
 export const postLikesRelations = relations(postLikes, ({ one }) => ({

  post: one(posts, {

    fields: [postLikes.postId],

    references: [posts.id],

  }),

}));