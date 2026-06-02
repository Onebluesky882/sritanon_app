import { relations } from "drizzle-orm/relations";
import { user } from "../auth-schema";
import { posts } from "../post";
import { comments } from "../comment";
import { postVotes } from "../vote";
import { postLikes } from "../post-like";


export const authorRelations = relations(user, ({ many }) => ({

  posts: many(posts),

}));


// Votes → Post

export const postVotesRelations = relations(postVotes, ({ one }) => ({

  post: one(posts, {

    fields: [postVotes.postId],

    references: [posts.id],

  }),

}));

// post 
export const postsRelations = relations(posts, ({  one, many }) => ({

  author : one(user, {fields : [posts.user], references : [user.id]}),

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