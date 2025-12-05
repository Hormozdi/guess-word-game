import { Telegraf } from "telegraf";

import { SocksProxyAgent } from "socks-proxy-agent";

import "dotenv/config";
import { startHandler } from "./botAssets/startHandler.js";
import { newGuessWordGame } from "./botAssets/startNewGuessWordGame.js";
import { playLetter } from "./botAssets/playLetter.js";

const agent = process.env.PROXY && new SocksProxyAgent(process.env.PROXY || "");

let bot = new Telegraf(process.env.BOT_TOKEN || "");
if (agent) {
  bot = new Telegraf(process.env.BOT_TOKEN || "", {
    telegram: { agent },
  });
}

bot.start(async (ctx) => {
  const data = await startHandler(ctx);
  ctx.reply(...data);
});

bot.on("callback_query", async (ctx) => {
  if (!("data" in ctx.callbackQuery)) return;

  const callbackText = ctx.callbackQuery.data;

  if (callbackText == "new_word_guess_game") {
    await newGuessWordGame(ctx);
  } else if (callbackText == "refresh_start_message") {
    const data = await startHandler(ctx);
    await ctx.editMessageText(...data);
  } else {
    await playLetter(ctx, callbackText);
  }
});

export { bot };

//   bot.telegram.editMessageText(
//     ctx.callbackQuery.message!.chat.id,
//     ctx.callbackQuery.message!.message_id,
//     undefined,
//     `You clicked2: ${selectedLetters.join(", ")}`,
//     {
//       reply_markup: {
//         inline_keyboard: createInlineKeyboard(),
//       },
//     }
//   );

// ctx.answerCbQuery(`You selected: ${selectedLetter}`);
// ctx.reply(`You selected: ${selectedLetter}`);
