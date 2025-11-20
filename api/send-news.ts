import dotenv from "dotenv";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Bot } from "grammy";
import axios from "axios";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from "ai";
import z from "zod";

dotenv.config();

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const bot = new Bot(process.env.BOT_TOKEN!);

const API_KEY = process.env.NEWS_API_KEY;
const BASE_URL = "https://newsapi.org/v2/everything";

interface Article {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
}

async function generateAIText({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    prompt: `
    Title: ${title}
    Description: ${description}
    `,
    system: `You are a helpful assistant - use some gen z and easy-to-understand words - when you can to make the title and description more engaging - that generates summary for the text given, and do NOT mention the source, e.g., Tech crunch etc. keep your response short and concise.`,
    schema: z.object({
      title: z.string(),
      description: z.string()
    }),
  });

  return object;
}

async function getLatestTechNews(): Promise<Article[]> {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        q: '"artificial intelligence" OR AI OR mobile OR smartphone OR laptop OR "tech company"',
        sources: "techcrunch,the-verge,wired,engadget,ars-technica",
        language: "en",
        sortBy: "publishedAt",
        pageSize: 4,
        apiKey: API_KEY,
      },
    });

    const articles: Article[] = response.data.articles.map((a: any) => ({
      title: a.title,
      description: a.description,
      imageUrl: a.urlToImage,
      url: a.url,
    }));

    return articles;
  } catch (error: any) {
    console.error("Error fetching tech news:", error.response?.data || error.message);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const chatId = "@Tech_Wizardz";

  try {
    const articles = await getLatestTechNews();

    for (const article of articles) {
      const { title, description } = await generateAIText({
        title: article.title,
        description: article.description,
      });

      const caption = `
<b>${title}</b>

${description}

<a href="${article.url}">Read more</a>

🚀 @Tech_Wizardz
      `;

      if (article.imageUrl) {
        await bot.api.sendPhoto(chatId, article.imageUrl, {
          caption,
          parse_mode: "HTML",
        });
      } else {
        await bot.api.sendMessage(chatId, caption, { parse_mode: "HTML" });
      }
    }

    res.status(200).send("Tech news sent successfully.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send tech news.");
  }
}
