import {
    ANSI_BLUE, ANSI_CYAN, ANSI_GRAY, ANSI_GREEN, ANSI_GREEN_BOLD,
    ANSI_RED_BOLD, COL_ORANGE, COL_VIOLET, COL_GRAY,
    getColoring, getAnsiColoring,
} from "../index.js";


const _ANSI_RED                 = getAnsiColoring("red");
const _ANSI_RED_BRIGHT          = getAnsiColoring("red",     {bright: true});
const _ANSI_RED_BOLD_BRIGHT     = getAnsiColoring("red",     {bold: true, bright: true});
const _ANSI_MAGENTA_BOLD_BRIGHT = getAnsiColoring("magenta", {bold: true, bright: true});
const _VIOLET_DARK              = getColoring("38;5;92");


console.log("[console size]:", process.stdout.columns || "??", + process.stdout.rows || "??");
console.log("COMMON_TEXT");
console.log(getColoring("2")("CSI 2 m")); // Possibly, gray text.

console.log(ANSI_BLUE("ANSI_BLUE"));
console.log(ANSI_CYAN("ANSI_CYAN"));
console.log(ANSI_GREEN("ANSI_GREEN"));
console.log(ANSI_GRAY("ANSI_GRAY"));
console.log(ANSI_GREEN_BOLD("ANSI_GREEN_BOLD"));
console.log(_ANSI_RED("ANSI_RED"));
console.log(_ANSI_RED_BRIGHT("ANSI_RED_BRIGHT"));
console.log(ANSI_RED_BOLD("ANSI_RED_BOLD"));
console.log(_ANSI_RED_BOLD_BRIGHT("ANSI_RED_BOLD_BRIGHT"));
console.log(_ANSI_MAGENTA_BOLD_BRIGHT("ANSI_MAGENTA_BOLD_BRIGHT"));
console.log(COL_ORANGE("8bit-ORANGE-208"));
console.log(COL_VIOLET("8bit-VIOLET-99"));
console.log(_VIOLET_DARK("8bit-VIOLET-92"));
console.log(COL_GRAY("8bit-GRAY-245"));
