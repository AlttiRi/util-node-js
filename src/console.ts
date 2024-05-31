export * from "./console-colors";

export const saveCursorPosition    = () => process.stdout.write("\u001B[s");
export const restoreCursorPosition = () => process.stdout.write("\u001B[u");
export const eraseCursorLine       = () => process.stdout.write("\u001B[K");

export const moveCursorToTop = (num = 1) => process.stdout.write(`\u001B[${num}A`);
