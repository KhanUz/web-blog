import mongoose from "mongoose";
import { ArticleModel } from "../../models/Article.js";
import { CommentModel } from "../../models/Comment.js";
import { ProfileModel } from "../../models/Profile.js";
import { UserModel } from "../../models/User.js";
import { hashPassword } from "../auth/passwords.js";

export async function seedDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  await UserModel.updateMany(
    {
      role: {
        $in: ["blogger", "administrator"]
      }
    },
    {
      $set: {
        role: "owner"
      }
    }
  );

  const viewer = await UserModel.findOneAndUpdate(
    { email: "viewer@example.com" },
    {
      $setOnInsert: {
        name: "Vera Viewer",
        role: "viewer",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        bio: "Reads the blog and keeps a lightweight profile.",
        passwordHash: hashPassword("viewer123"),
        sessionTokenHash: null,
        active: true
      }
    },
    { new: true, upsert: true }
  );

  const owner = await UserModel.findOneAndUpdate(
    { email: "owner@example.com" },
    {
      $setOnInsert: {
        name: "Olive Owner",
        role: "owner",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        bio: "Writes, publishes, and manages the site.",
        passwordHash: hashPassword("owner123"),
        sessionTokenHash: null,
        active: true
      }
    },
    { new: true, upsert: true }
  );

  const articleCount = await ArticleModel.countDocuments();

  if (articleCount > 0) {
    const usersWithoutPassword = await UserModel.find({
      $or: [
        { passwordHash: { $exists: false } },
        { passwordHash: "" }
      ]
    });

    for (const user of usersWithoutPassword) {
      const fallbackPassword = user.role === "owner" ? "owner123" : "viewer123";
      user.passwordHash = hashPassword(fallbackPassword);
      user.sessionTokenHash = null;
      await user.save();
    }

    const orphanedArticles = await ArticleModel.find({ author: null }).sort({ createdAt: 1 });

    for (const article of orphanedArticles) {
      article.author = owner._id;
      article.authorName = owner.name;
      await article.save();
    }

    const profileCount = await ProfileModel.countDocuments();
    if (profileCount === 0) {
      await ProfileModel.create({
        name: "Olim",
        role: "Designer, developer, and independent publisher",
        bio: "I write about interface design, practical web development, editorial systems, and the small decisions that make digital products easier to use and easier to trust.",
        topics: ["Interface design", "Publishing workflows", "Frontend engineering", "Writing systems"],
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
    }

    return;
  }

  const articleOne = await ArticleModel.create({
    author: owner._id,
    authorName: owner.name,
    title: "Designing a blog that keeps the text in charge",
    slug: "designing-a-blog-that-keeps-the-text-in-charge",
    summary: "A quiet editorial layout that keeps reading at the center of the experience.",
    content: `# Designing a blog that keeps the text in charge

Minimal interfaces work best when structure is felt rather than announced. A blog should earn attention through writing, not by constantly asking the reader to manage the interface.

---

## Reading flow

The main column should do most of the visual work while the supporting navigation remains subtle.

- Keep the reading width comfortable.
- Reduce decorative interruption.
- Use hierarchy to orient, not to distract.

## Structure that stays quiet

When layout is working well, the reader rarely notices it directly. They simply move from title to paragraph to section without friction.

> Good editorial design feels calm before it feels impressive.

### Table of contents

Desktop readers benefit from orientation cues. Mobile readers benefit from less chrome.

## Small system choices

1. Published posts should be easy to scan.
2. Drafts should be easy for the owner to manage.
3. Comments should support thoughtful discussion.

## A practical note

Sometimes the best implementation detail is also the simplest one:

\`\`\`ts
const readingGoal = "clarity over decoration";
\`\`\`

For related thinking, see [Building archive pages that readers actually use](/).
`,
    categories: ["Interface"],
    tags: ["design", "editorial", "reading"],
    status: "published",
    publishedAt: new Date("2026-03-28T09:00:00.000Z")
  });

  const articleTwo = await ArticleModel.create({
    author: owner._id,
    authorName: owner.name,
    title: "Building archive pages that readers actually use",
    slug: "building-archive-pages-that-readers-actually-use",
    summary: "Archive pages should help exploration instead of trapping the reader in chronology.",
    content: `# Building archive pages that readers actually use

Archive views need both time-based structure and thematic escape routes.

## What readers actually need

Most readers do not arrive thinking in months or years. They arrive with partial memory: a phrase, a theme, or a feeling that they have seen a useful post before.

## Better archive signals

- Short summaries
- Clear dates
- Themes or categories
- Search that actually narrows results

## Why chronology is not enough

Chronology is useful, but it should not be the only way through a body of work.

---

### A better archive page usually combines:

1. Date-based browsing
2. Thematic groupings
3. Searchable titles and summaries

That combination makes older writing easier to find and more likely to be read again.`,
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
      status: "approved"
    }
  ]);

  await ProfileModel.create({
    name: "Olim",
    role: "Designer, developer, and independent publisher",
    bio: "I write about interface design, practical web development, editorial systems, and the small decisions that make digital products easier to use and easier to trust.",
    topics: ["Interface design", "Publishing workflows", "Frontend engineering", "Writing systems"],
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
