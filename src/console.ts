export * from "./console-colors.js";

export const saveCursorPosition    = () => process.stdout.write("\u001B[s");
export const restoreCursorPosition = () => process.stdout.write("\u001B[u");
export const eraseCursorLine       = () => process.stdout.write("\u001B[K");

export const moveCursorToTop = (num = 1) => process.stdout.write(`\u001B[${num}A`);

export function stdWrite(text: string): Promise<void> {
    return new Promise((resolve, reject) => process.stdout.write(text, err => {
        if (err) {
            reject(err);
        }
        resolve();
    }));
}
