const _ANSI_RESET = "\u001B[0m";

/** @typedef {"black"|"red"|"green"|"yellow"|"blue"|"magenta"|"cyan"|"white"} ANSIColor */

/** @type {Map<ANSIColor, number>} */
const ansiColorsMap = new Map([
    ["black",   30],
    ["red",     31],
    ["green",   32],
    ["yellow",  33],
    ["blue",    34],
    ["magenta", 35],
    ["cyan",    36],
    ["white",   37],
]);

/**
 * [ANSI_escape_code#SGR]{@link https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_(Select_Graphic_Rendition)_parameters}
 * ```
 * "32" - Green [ANSI]
 * "36" - Cyan  [ANSI]
 * "38;5;208" - Orange #ff8700 [8-bit]
 * "38;5;99"  - Violet #875fff [8-bit]
 * "38;2;173;255;47" - Green-Yellow #adff2f [24-bit]
 * ```
 * @example
 * const COL_VIOLET_DARK = getColoring("38;5;92");
 * console.log(COL_VIOLET_DARK("This text is 8-bit dark violet"));
 * @param {String} mode
 * @return {function(text: any): String}
 */
export function getColoring(mode) {
    return text => `\u001B[${mode}m${text}${_ANSI_RESET}`;
}

/**
 * @example
 * const ANSI_RED_BOLD = getAnsiColoring("RED", {bold: true});
 * console.log(ANSI_RED_BOLD("This text is bold red"));
 * @param {ANSIColor} [color="white"]
 * @param {Object} [opts]
 * @param {Boolean} [opts.bright=false]
 * @param {Boolean} [opts.bold=false]
 * @return {function(text: any): String}
 */
export function getAnsiColoring(color = "white", opts= {}) {
    const {bright, bold} = Object.assign({bright: false, bold: false}, opts);
    let num = ansiColorsMap.get(color);
    if (bright) {
        num += 60;
    }
    const boldStr = bold ? "1;" : "";
    const colorMod = `${boldStr}${num}`;
    return getColoring(colorMod);
}
