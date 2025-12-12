import { Context, session, Telegraf } from "telegraf";

import { SocksProxyAgent } from "socks-proxy-agent";

import "dotenv/config";
import { startHandler } from "./botAssets/startHandler.js";
import { newGuessWordGame } from "./botAssets/startNewGuessWordGame.js";
import { playLetter } from "./botAssets/playLetter.js";
import {
  convertArrayToText,
  createInlineNumbersKeyboard,
  decreaseUserCredit,
  persianLetters,
} from "./botAssets/utils.js";
import { prismaClient } from "../lib/prisma.js";

const agent = process.env.PROXY
  ? new SocksProxyAgent(process.env.PROXY)
  : undefined;

export interface MyContext extends Context {
  session: any;
}

const BOT_TOKEN = process.env.BOT_TOKEN || "";

const bot = new Telegraf<MyContext>(BOT_TOKEN, { telegram: { agent } });

bot.use(session());

bot.start(async (ctx) => {
  const data = await startHandler(ctx);
  ctx.reply(...data);
});

// bot.command("poll", async (ctx) => {
//   const data = await ctx.replyWithPoll(
//     "کدوم زبان برنامه‌نویسی بهتره؟",
//     ["Python", "JavaScript", "Go"],
//     { is_anonymous: true }
//   );
//   console.log({ data });
// });

// (async () => {
//   const test = await bot.telegram.sendPoll(
//     150994084,
//     "کدوم زبان برنامه‌نویسی بهتره؟",
//     ["Python", "JavaScript", "Go"],
//     { is_anonymous: false }
//   );

//   bot.telegram.stopPoll(150994084, test.message_id);

//   console.log({ test });
// })();

// bot.on("poll_answer", (ctx) => {
//   const answer = ctx.update.poll_answer;
//   console.log({ answer });

//   // console.log('User ID:', answer.user.id);
//   // console.log('Selected options:', answer.option_ids);
// });

const ads = [
  {
    text: "۱۲۰,۰۰۰ تومان اعتبار رایگان در صرافی تبدیل!",
    link: "https://tabdeal.org/auth/register-req?refcode=apr25_5e5l04",
  },
];

export function randomAds() {
  return (
    "⭕️ تبلیغات: " + "<a href='" + ads[0].link + "'>" + ads[0].text + "</a>"
  );
}

function createBingoPost(numbers: string[] = []) {
  return [
    convertArrayToText([
      randomAds(),
      "",
      numbers.length >= 5
        ? "شما ۵ عدد انتخاب کردید. منتظر شروع بازی باشید!"
        : "از بین اعداد زیر، ۵ عدد متفاوت رو شانسی انتخاب کن",
      "",
      numbers.length ? "اعداد انتخاب شده:" : "",
      "<b>" + numbers.join("</b> 🔹 <b>") + "</b>",
      "",
    ]),
  ];
}

bot.on("callback_query", async (ctx) => {
  if (!("data" in ctx.callbackQuery)) return;

  const callbackText = ctx.callbackQuery.data;

  if (callbackText == "new_word_guess_game") {
    const decreased = await decreaseUserCredit(ctx, 1);
    if (!decreased) return;

    await newGuessWordGame(ctx);
  } else if (callbackText == "new_bingo_game") {
    const decreased = await decreaseUserCredit(ctx, 5);
    if (!decreased) return;

    const [text] = createBingoPost();
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: createInlineNumbersKeyboard(),
      },
    });
  } else if (callbackText == "refresh_start_message") {
    const oldText = (ctx.callbackQuery?.message as any)?.text ?? "";
    const data = await startHandler(ctx);
    if (oldText.trim() == data[0].trim()) {
      await ctx.answerCbQuery("چیزی برای بروزرسانی نیست!");
    } else {
      await ctx.editMessageText(...data);
    }
  } else if (persianLetters.includes(callbackText)) {
    await playLetter(ctx, callbackText);
  } else if (callbackText.startsWith("bingo_number:")) {
    const number = callbackText.split(":")[1];
    const messageText = (ctx.callbackQuery?.message as any)?.text;
    if (typeof messageText !== "string") {
      await ctx.answerCbQuery("پیام متنی موجود نیست.");
      return;
    }
    const lines = messageText.split("\n");

    const selectedLineIndex = lines.findIndex((line: string) =>
      line.startsWith("اعداد انتخاب شده:")
    );
    const selectedNumbers =
      selectedLineIndex > 0
        ? (lines[selectedLineIndex + 1] || "")
            .split("🔹")
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
        : [];

    if (selectedNumbers.includes(number)) {
      await ctx.answerCbQuery("این عدد قبلا انتخاب شده است.");
      return;
    }

    selectedNumbers.push(number);

    const [text] = createBingoPost(selectedNumbers);

    setImmediate(async () => {
      await bot.telegram.editMessageText(
        ctx.from.id,
        ctx.callbackQuery.message?.message_id,
        undefined,
        text,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard:
              selectedNumbers.length < 5 ? createInlineNumbersKeyboard() : [],
          },
        }
      );
    });

    if (selectedNumbers.length >= 5) {
      await prismaClient.bingoGame.create({
        data: {
          telegramId: ctx.from.id,
          messageId: ctx.callbackQuery.message?.message_id!,
          numbers: selectedNumbers,
        },
      });
    }

    return;
  } else {
    await ctx.reply("دستور ناشناخته است.");
  }

  return;
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
