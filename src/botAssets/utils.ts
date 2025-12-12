import { Context, Markup } from "telegraf";
import type { InlineKeyboardButton } from "telegraf/types";
import { prismaClient } from "../../lib/prisma.js";
import { randomAds } from "../bot.js";

export const persianLetters = [
  "ا",
  "ب",
  "پ",
  "ت",
  "ث",
  "ج",
  "چ",
  "ح",
  "خ",
  "د",
  "ذ",
  "ر",
  "ز",
  "ژ",
  "س",
  "ش",
  "ص",
  "ض",
  "ط",
  "ظ",
  "ع",
  "غ",
  "ف",
  "ق",
  "ک",
  "گ",
  "ل",
  "م",
  "ن",
  "و",
  "ه",
  "ی",
];

export function convertArrayToText(arr: string[]): string {
  return arr.join("\n");
}

export function createInlineKeyboard(
  correctLetters: string[],
  wrongLetters: string[],
  chunkSize = 4
) {
  const selectedLetters = [...correctLetters, ...wrongLetters];

  const remainKeyboards = persianLetters.filter(
    (letter) => !selectedLetters.includes(letter)
  );

  const inline_keyboard: InlineKeyboardButton[][] = [];
  for (let i = 0; i < remainKeyboards.length; i += chunkSize) {
    const row = remainKeyboards
      .slice(i, i + chunkSize)
      .map((label) => Markup.button.callback(label, label));
    inline_keyboard.push(row.reverse());
  }

  return inline_keyboard;
}

export function createInlineNumbersKeyboard(chunkSize = 5) {
  const inline_keyboard: InlineKeyboardButton[][] = [];

  const arr = Array.from({ length: 20 }, (_, i) => i + 1);
  const result = [];

  for (let i = 0; i < arr.length; i += chunkSize) {
    inline_keyboard.push(
      arr
        .slice(i, i + chunkSize)
        .map((label) =>
          Markup.button.callback(
            label.toString(),
            "bingo_number:" + label.toString()
          )
        )
    );
  }

  return inline_keyboard;
}

export function createGameText(
  word: string,
  correctLetters: string[],
  wrongLetters: string[],
  isEnd = false
) {
  return convertArrayToText([
    randomAds(),
    "",
    "کلمه مورد نظر:",
    word
      .split("")
      .map((letter) => (correctLetters.includes(letter) ? letter : " 🔲 "))
      .join(""),
    "",
    `تعداد حدس های اشتباه: ${wrongLetters.length}`,
    "",
    ...(isEnd ? [] : ["لطفا یکی از حروف زیر را انتخاب کنید:"]),
    "",
  ]);
}

export async function decreaseUserCredit(
  ctx: Context,
  amount: number
): Promise<boolean> {
  const user = await prismaClient.user.findFirstOrThrow({
    where: { telegramId: ctx.from?.id },
  });

  const totalCredit = user.silverCredit + user.goldCredit;
  if (totalCredit < amount) {
    await ctx.answerCbQuery("موجودی سکه شما برای شروع بازی کافی نیست.");
    return false;
  }

  let newSilver = user.silverCredit - amount;
  let newGold = user.goldCredit;

  if (newSilver < 0) {
    // silver not enough, deduct remaining from gold
    newGold += newSilver; // newSilver is negative here
    newSilver = 0;
  }

  await prismaClient.user.update({
    where: { id: user.id },
    data: {
      silverCredit: newSilver,
      goldCredit: newGold,
    },
  });

  return true;
}
