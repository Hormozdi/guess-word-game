import type { Context, NarrowedContext } from "telegraf";
import { prismaClient } from "../../lib/prisma.js";
import {
  convertArrayToText,
  createGameText,
  createInlineKeyboard,
} from "./utils.js";
import type { CallbackQuery, Update } from "telegraf/types";
import { bot } from "../bot.js";

export const playLetter = async (
  ctx: NarrowedContext<
    Context<Update>,
    Update.CallbackQueryUpdate<CallbackQuery>
  >,
  letter: string
) => {
  const game = await prismaClient.guessWordGame.findFirstOrThrow({
    where: {
      players: {
        some: {
          telegramId: ctx.from.id,
          messageId: ctx.callbackQuery.message?.message_id!,
        },
      },
    },
    include: {
      players: true,
    },
  });

  const player = game.players.find((el) => el.telegramId === ctx.from.id);

  if (!player) {
    return;
  }

  const correctLetters = Array.isArray(player.correctLetters)
    ? player.correctLetters
    : [];

  const wrongLetters = Array.isArray(player.wrongLetters)
    ? player.wrongLetters
    : [];

  if (game.word.includes(letter)) {
    correctLetters.push(letter);
  } else {
    wrongLetters.push(letter);
  }

  await prismaClient.guessWordGamePlayer.update({
    where: { id: player.id },
    data: {
      correctLetters,
      wrongLetters,
    },
  });

  const isEnd = [...game.word].every((letter) =>
    correctLetters.includes(letter)
  );

  ctx.editMessageText(
    createGameText(
      game.word,
      correctLetters as string[],
      wrongLetters as string[],
      isEnd
    ),
    {
      reply_markup: {
        inline_keyboard: isEnd
          ? []
          : createInlineKeyboard(
              correctLetters as string[],
              wrongLetters as string[]
            ),
      },
    }
  );

  if (isEnd) {
    setImmediate(async () => {
      const sentMessage = await bot.telegram.sendMessage(
        ctx.from.id,
        convertArrayToText([
          "لطفا منتظر نهایی شدن نتیجه حریف باشید.",
          "امیدوارم شما برنده این دست باشید",
        ])
      );

      await prismaClient.guessWordGamePlayer.update({
        where: { id: player.id },
        data: {
          messageId: sentMessage.message_id,
        },
      });
    });
  }
};
