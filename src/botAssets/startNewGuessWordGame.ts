import type { Context, NarrowedContext } from "telegraf";
import { GuessWordGameStatus } from "../../generated/prisma/enums.js";
import { prismaClient } from "../../lib/prisma.js";
import { words } from "../../lib/words.js";
import { createGameText, createInlineKeyboard } from "./utils.js";
import type { CallbackQuery, Update } from "telegraf/types";

export const newGuessWordGame = async (
  ctx: NarrowedContext<
    Context<Update>,
    Update.CallbackQueryUpdate<CallbackQuery>
  >
) => {
  let games = await prismaClient.guessWordGame.findMany({
    orderBy: { createdAt: "desc" },
    where: { status: GuessWordGameStatus.NEW },
    include: { players: true },
  });

  const game = games.find(
    (game) => game.players[0]?.telegramId !== ctx.from.id
  );

  let gameId;
  let word;

  if (game) {
    gameId = game.id;
    word = game.word;
    await prismaClient.guessWordGame.update({
      where: { id: gameId },
      data: { status: GuessWordGameStatus.PLAYING },
    });
  } else {
    word = words[Math.floor(Math.random() * words.length)];

    const newGame = await prismaClient.guessWordGame.create({
      data: { word },
    });
    gameId = newGame.id;
  }

  const sentMessage = await ctx.reply(createGameText(word, [], []), {
    reply_markup: {
      inline_keyboard: createInlineKeyboard([], []),
    },
  });

  await prismaClient.guessWordGamePlayer.create({
    data: {
      gameId,
      telegramId: ctx.from.id,
      messageId: sentMessage.message_id,
    },
  });
};
