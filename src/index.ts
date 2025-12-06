import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { bot } from "./bot.js";
import { GuessWordGameStatus } from "../generated/prisma/enums.js";
import { prismaClient } from "../lib/prisma.js";
import type { GuessWordGamePlayer } from "../generated/prisma/browser.js";
import { convertArrayToText } from "./botAssets/utils.js";

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
      function countWrong(player: GuessWordGamePlayer) {
        return Array.isArray(player.wrongLetters)
          ? player.wrongLetters.length
          : 0;
      }

      const [p1, p2] = game.players;
      const p1wll = countWrong(p1);
      const p2wll = countWrong(p2);

      console.log(p1wll, p2wll);

      let winner: GuessWordGamePlayer | null = null;
      let loser: GuessWordGamePlayer | null = null;

      if (p1wll === p2wll) {
      } else if (p1wll < p2wll) {
        winner = p1;
        loser = p2;
      } else {
        winner = p2;
        loser = p1;
      }

      if (!loser || !winner) {
        return;
      }

      await bot.telegram.editMessageText(
        String(winner.telegramId),
        winner.messageId,
        undefined,
        convertArrayToText([
          "🎉 تبریک! شما در بازی کلمه «" + game.word + "» برنده شدید! 🎉",
          "",
          "حساب کاربری شما به میزان 1.8 سکه شارژ شد.",
        ])
      );

      await bot.telegram.editMessageText(
        String(loser.telegramId),
        loser.messageId,
        undefined,
        convertArrayToText([
          "بازی کلمه «" + game.word + "» تمام شد!",
          "",
          "متاسفانه شما بازنده شدید. انشاالله دفعه بعد شما برنده خواهید شد!",
        ])
      );

      await prismaClient.guessWordGame.update({
        where: { id: game.id },
        data: {
          status: GuessWordGameStatus.DONE,
        },
      });
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
