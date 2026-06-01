import { account, session, user, verification } from "./auth-schema";
import { comments } from "./comment";
import { posts } from "./post";
import { postLikes } from "./post-like";
import { postsRelations } from "./reletions";
import { postVotes } from "./vote";


export const schema = {
  posts,
   user , 
   session,
   account,
   verification,
   postVotes,
   postLikes,
   comments,
   postsRelations
}
export * from './post'
export * from './auth-schema'
export * from './vote'
export * from './post-like'
export * from './comment'
export * from './reletions'