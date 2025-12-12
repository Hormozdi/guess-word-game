import { Context, Markup } from "telegraf";
import { prismaClient } from "../../lib/prisma.js";
import { convertArrayToText } from "./utils.js";
import { randomAds } from "../bot.js";

export function createWelcomeMessage() {
  return;
}

export async function startHandler(ctx: Context): Promise<[string, object]> {
  const telegramId = ctx.from?.id || 0;

  console.log(telegramId);

  const user = await prismaClient.user.upsert({
    where: { telegramId },
    create: { telegramId, silverCredit: 10 },
    update: {},
  });

  return [
    convertArrayToText([
      randomAds(),
      "",
      "🎉 به ربات بازی های کلمه و عدد خوش آمدید! 🎉",
      "موجودی سکه طلا: " + user.goldCredit,
      "موجودی سکه نقره: " + user.silverCredit,
      "",
    ]),
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            Markup.button.callback(
              "🔃 به روزرسانی پیام",
              "refresh_start_message"
            ),
          ],
          [Markup.button.callback("🔤 بازی حدس کلمه", "new_word_guess_game")],
          [Markup.button.callback("🔢 بازی حدس عدد", "new_bingo_game")],
        ],
      },
    },
  ];
}
