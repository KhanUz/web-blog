import mongoose from "mongoose";
import { ArticleModel } from "../models/Article.js";
import { CommentModel } from "../models/Comment.js";
import { ProfileModel } from "../models/Profile.js";

export async function seedDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const articleCount = await ArticleModel.countDocuments();

  if (articleCount > 0) {
    return;
  }

  const articleOne = await ArticleModel.create({
    title: "Designing a blog that keeps the text in charge",
    slug: "designing-a-blog-that-keeps-the-text-in-charge",
    summary: "A quiet editorial layout that keeps reading at the center of the experience.",
    content: `# Designing a blog that keeps the text in charge

Minimal interfaces work best when structure is felt rather than announced.

## Reading flow

The main column should do most of the visual work while the supporting navigation remains subtle.

### Table of contents

Desktop readers benefit from orientation cues. Mobile readers benefit from less chrome.
`,
    categories: ["Interface"],
    tags: ["design", "editorial", "reading"],
    status: "published",
    publishedAt: new Date("2026-03-28T09:00:00.000Z")
  });

  const articleTwo = await ArticleModel.create({
    title: "Building archive pages that readers actually use",
    slug: "building-archive-pages-that-readers-actually-use",
    summary: "Archive pages should help exploration instead of trapping the reader in chronology.",
    content: `# Building archive pages that readers actually use

Archive views need both time-based structure and thematic escape routes.`,
    categories: ["Archive"],
    tags: ["archive", "ux"],
    status: "draft",
    publishedAt: null
  });

  await CommentModel.insertMany([
    {
      article: articleOne._id,
      authorName: "Mina",
      body: "The TOC behavior feels right. Keeping it off mobile is a good tradeoff.",
      status: "approved"
    },
    {
      article: articleOne._id,
      authorName: "Rae",
      body: "Would be useful to link tags directly from the article footer too.",
      status: "pending"
    }
  ]);

  await ProfileModel.create({
    name: "Olim",
    role: "Blogger and builder",
    bio: "Writing about calm interfaces, practical software, and editorial systems.",
    topics: ["Interface design", "HTMX", "Node.js", "Writing systems"],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/"
      },
      {
        label: "Email",
        url: "mailto:hello@example.com"
      }
    ]
  });

  await ArticleModel.updateOne(
    { _id: articleTwo._id },
    { $set: { summary: articleTwo.summary } }
  );
}
