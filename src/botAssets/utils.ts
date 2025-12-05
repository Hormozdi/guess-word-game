import { Markup } from "telegraf";
import type { InlineKeyboardButton } from "telegraf/types";

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

export function createGameText(
  word: string,
  correctLetters: string[],
  wrongLetters: string[],
  isEnd = false
) {
  return convertArrayToText([
    "کلمه مورد نظر:",
    "",
    word
      .split("")
      .map((letter) => (correctLetters.includes(letter) ? letter : "⬜"))
      .join(""),
    "",
    `تعداد حدس های اشتباه: ${wrongLetters.length}`,
    "",
    ...(isEnd
      ? [
          "لطفا منتظر نهایی شدن نتیجه حریف باشید.",
          "امیدوارم شما برنده این دست باشید",
        ]
      : ["لطفا یکی از حروف زیر را انتخاب کنید:"]),
    "",
  ]);
}
