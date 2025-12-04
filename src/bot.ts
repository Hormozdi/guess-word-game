import { Telegraf } from "telegraf";

import { SocksProxyAgent } from "socks-proxy-agent";

import "dotenv/config";
import { startHandler } from "./botAssets/startHandler.js";
import { newGuessWordGame } from "./botAssets/startNewGuessWordGame.js";
import { playLetter } from "./botAssets/playLetter.js";

const agent = new SocksProxyAgent(process.env.PROXY || "");

const bot = new Telegraf(process.env.BOT_TOKEN || "", {
  telegram: process.env.PROXY ? { agent } : {},
});

bot.start(startHandler);

bot.on("callback_query", async (ctx) => {
  if (!("data" in ctx.callbackQuery)) return;

  const callbackText = ctx.callbackQuery.data;

  if (callbackText == "new_word_guess_game") {
    await newGuessWordGame(ctx);
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
