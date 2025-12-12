import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { bot } from "./bot.js";
import { GameStatus } from "../generated/prisma/enums.js";
import { prismaClient } from "../lib/prisma.js";
import type { GuessWordGamePlayer } from "../generated/prisma/browser.js";
import { convertArrayToText } from "./botAssets/utils.js";
import { pollBot } from "./pollBot.js";

const app = new Hono();

bot.launch();
pollBot.launch();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("charge-accounts", async (c) => {
  await prismaClient.user.updateMany({
    where: {
      silverCredit: { lt: 10 },
    },
    data: {
      silverCredit: {
        increment: 1,
      },
    },
  });
  return c.text("Check Games Done!");
});

app.get("/check-games", async (c) => {
  await doneGuessWordGames();
  await doneBingoGames();
  return c.text("Check Games Done!");
});

async function doneBingoGames() {
  const games = await prismaClient.bingoGame.findMany({
    where: {
      status: GameStatus.NEW,
    },
    distinct: ["telegramId"],
    take: 10,
  });

  if (games.length != 10) return;

  const arr = Array.from({ length: 20 }, (_, i) => i + 1);
  const shuffled = arr.sort(() => Math.random() - 0.5);
  const numbers = shuffled.slice(0, 5);

  let total = 0;
  const result = games.map((game) => {
    const matchesCount = (game.numbers as number[]).filter((n) =>
      numbers.includes(n)
    ).length;

    total += matchesCount;

    return {
      telegramId: game.telegramId,
      messageId: game.messageId,
      numbers,
      count: matchesCount,
    };
  });

  const prize = Math.floor((45 * 100) / total) / 100;

  result.forEach(async (res) => {
    try {
      await prismaClient.user.update({
        where: { telegramId: res.telegramId },
        data: {
          goldCredit: {
            increment: res.count * prize,
          },
        },
      });

      await bot.telegram.editMessageText(
        res.telegramId.toString(),
        res.messageId,
        undefined,
        convertArrayToText([
          "🎉 بازی بینگو تمام شد! 🎉",
          "",
          "اعداد برنده: " + numbers.join(" , "),
          "اعداد شما: " + res.numbers.join(" , "),
          "حساب کاربری شما به میزان " + res.count * prize + " سکه شارژ شد.",
        ])
      );
    } catch (error) {}
  });
}

async function doneGuessWordGames() {
  const games = await prismaClient.guessWordGame.findMany({
    where: {
      status: GameStatus.PLAYING,
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

      try {
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

        await prismaClient.user.update({
          where: { telegramId: winner.telegramId },
          data: {
            goldCredit: {
              increment: 1.8,
            },
          },
        });
      } catch (error) {}

      try {
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
      } catch (error) {}

      await prismaClient.guessWordGame.update({
        where: { id: game.id },
        data: {
          status: GameStatus.DONE,
        },
      });
    }
  }
}

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
