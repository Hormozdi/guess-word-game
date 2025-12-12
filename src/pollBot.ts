import { Context, Markup, session, Telegraf } from "telegraf";

import { SocksProxyAgent } from "socks-proxy-agent";

import "dotenv/config";
import { startHandler } from "./botAssets/startHandler.js";

const agent = process.env.PROXY
  ? new SocksProxyAgent(process.env.PROXY)
  : undefined;

export interface MyContext extends Context {
  session: any;
}

const BOT_TOKEN = process.env.POLL_BOT_TOKEN || "";

const pollBot = new Telegraf<MyContext>(BOT_TOKEN, { telegram: { agent } });

pollBot.use(session());

pollBot.start(async (ctx) => {
  ctx.reply("Hi! I'm Poll Bot.");
});

pollBot.telegram.sendMessage(-1003452627249, "ddddd", {
  parse_mode: "HTML",
  reply_markup: {
    inline_keyboard: [
      ...["111111", "555555555"].map((label) => [
        Markup.button.callback(
          label.toString(),
          "bingo_number:" + label.toString()
        ),
      ]),
    ],
  },
});

pollBot.command("newPoll", async (ctx) => {
  ctx.reply("لطفا متن سوال را وارد کنید.");
  ctx.session = { step: "newPoll" };
  //   ctx.answerCbQuery("Hi");
});

pollBot.on("text", async (ctx) => {
  if (ctx.session?.step == "newPoll") {
    if (!ctx.session?.content) {
      ctx.session.content = ctx.message.text;
      ctx.reply("لطفا گزینه‌های نظرسنجی را خط به خط وارد کنید.");
    } else {
      const options = ctx.message.text
        .split("\n")
        .map((opt: string) => opt.trim())
        .filter((opt: string) => opt.length > 0);
      if (options.length < 2) {
        ctx.reply("لطفا حداقل دو گزینه وارد کنید.");
        return;
      } else {
        ctx.reply(ctx.session.content, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              options.map((label) =>
                Markup.button.callback(
                  label.toString(),
                  "bingo_number:" + label.toString()
                )
              ),
            ],
          },
        });
      }
    }
  }
  console.log(ctx.message.text);
});

pollBot.on("callback_query", async (ctx) => {
  if (!("data" in ctx.callbackQuery)) return;

  const callbackText = ctx.callbackQuery.data;

  console.log({ callbackText });

  ctx.answerCbQuery("llllllllll");

  return;
});

export { pollBot };
