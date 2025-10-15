"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const dotenv_1 = __importDefault(require("dotenv"));
const grammy_1 = require("grammy");
dotenv_1.default.config();
const bot = new grammy_1.Bot(process.env.BOT_TOKEN);
async function getTechNews() {
    const endpoint = `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=3&apiKey=${process.env.NEWS_API_KEY}`;
    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error(`NewsAPI request failed: ${response.statusText}`);
    }
    const data = await response.json();
    const articles = data.articles.slice(0, 3).map((a) => ({
        title: a.title,
        description: a.description,
        imageUrl: a.urlToImage,
        url: a.url,
    }));
    return articles;
}
async function handler(req, res) {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Failed to send message");
    }
}
