import { Context, Markup } from "telegraf";
import { prismaClient } from "../../lib/prisma.js";
import { convertArrayToText } from "./utils.js";

export const startHandler = async (ctx: Context) => {
  const telegramId = ctx.from?.id || 0;
  const user = await prismaClient.user.upsert({
    where: { telegramId },
    create: { telegramId, silverCredit: 10 },
    update: {},
  });

  return ctx.reply(
    convertArrayToText([
      "موجودی سکه طلا: " + user.goldCredit,
      "موجودی سکه نقره: " + user.silverCredit,
      "",
    ]),
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback("بازی حدس کلمه", "new_word_guess_game")],
        ],
      },
    }
  );
};
