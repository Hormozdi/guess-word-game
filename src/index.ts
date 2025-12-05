import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { bot } from "./bot.js";
import { GuessWordGameStatus } from "../generated/prisma/enums.js";
import { prismaClient } from "../lib/prisma.js";

const app = new Hono();

bot.launch();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/done-guess-word-games", async (c) => {
  const games = await prismaClient.guessWordGame.findMany({
    where: {
      status: GuessWordGameStatus.PLAYING,
    },
    include: {
      players: true,
    },
  });
  for (const game of games) {
    const isDone = game.players.every((player) => {
      const correctLetters = Array.isArray(player.correctLetters)
        ? player.correctLetters
        : [];

      return [...game.word].every((letter) => correctLetters?.includes(letter));
    });

    if (isDone) {
      await prismaClient.guessWordGame.update({
        where: { id: game.id },
        data: {
          status: GuessWordGameStatus.DONE,
        },
      });

      await bot.telegram.editMessageText(
        game.players[0].telegramId,
        game.players[0].messageId,
        undefined,
        // `🎉 Congratulations! The word was "${game.word}". You've completed the game! 🎉`
        "بازی تمام شد!"
      );
    }
  }

  return c.text("Ceck Games Done!");
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
