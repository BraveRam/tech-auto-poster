import dotenv from "dotenv";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Bot } from "grammy";

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN!);

interface Article {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
}

async function getTechNews(): Promise<Article[]> {
  const endpoint = `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=3&apiKey=${process.env.NEWS_API_KEY}`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`NewsAPI request failed: ${response.statusText}`);
  }

  const data = await response.json();

  const articles: Article[] = data.articles.slice(0, 3).map((a: any) => ({
    title: a.title,
    description: a.description,
    imageUrl: a.urlToImage,
    url: a.url,
  }));

  return articles;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const chatId = "@tgchannelv1";

  try {
    const articles = await getTechNews();
    for (const article of articles) {
      await bot.api.sendPhoto(chatId, article.imageUrl, {
        caption: `
📰 <b>${article.title}</b>

📝 ${article.description}

🔗 <a href="${article.url}">Read more</a>
                `,
        parse_mode: "HTML",
      });
    }
    res.status(200).send("Message sent");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send message");
  }
}
