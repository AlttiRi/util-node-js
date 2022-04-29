import {getColoring, getAnsiColoring} from "./console-colors-core.js";

export {
    getColoring,
    getAnsiColoring,
};

// Some predefined colors
export const ANSI_BLUE  = /*#__PURE__*/ getAnsiColoring("blue");
export const ANSI_CYAN  = /*#__PURE__*/ getAnsiColoring("cyan");
export const ANSI_GREEN = /*#__PURE__*/ getAnsiColoring("green");
export const ANSI_GRAY  = /*#__PURE__*/ getAnsiColoring("black", {bright: true});
export const ANSI_GREEN_BOLD = /*#__PURE__*/ getAnsiColoring("green", {bold: true});
export const ANSI_RED_BOLD   = /*#__PURE__*/ getAnsiColoring("red",   {bold: true});

export const COL_ORANGE = /*#__PURE__*/ getColoring("38;5;208");
export const COL_VIOLET = /*#__PURE__*/ getColoring("38;5;99");
export const COL_GRAY   = /*#__PURE__*/ getColoring("38;5;245");
