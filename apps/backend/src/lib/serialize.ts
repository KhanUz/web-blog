import type { ArticleDocument } from "../models/Article.js";
import type { CommentDocument } from "../models/Comment.js";
import type { ProfileDocument } from "../models/Profile.js";
import type { UserDocument } from "../models/User.js";

export function serializeArticle(article: ArticleDocument) {
  return {
    id: article.id,
    authorId: article.author?.toString() ?? null,
    authorName: article.authorName,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    content: article.content,
    categories: article.categories,
    tags: article.tags,
    status: article.status,
    publishedAt: article.publishedAt,
    removedFromSiteAt: article.removedFromSiteAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt
  };
}

export function serializeComment(comment: CommentDocument) {
  return {
    id: comment.id,
    articleId: comment.article.toString(),
    authorName: comment.authorName,
    body: comment.body,
    status: comment.status,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt
  };
}

export function serializeProfile(profile: ProfileDocument) {
  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    bio: profile.bio,
    topics: profile.topics,
    links: profile.links,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

export function serializeUser(user: UserDocument) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
