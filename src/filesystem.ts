import fs from "node:fs/promises";
import path from "node:path";


export function exists(path: string, followSymbol = true): Promise<boolean> {
    return (followSymbol ? fs.stat(path) : fs.lstat(path)).then(() => true, () => false);
}

/** Is the passed symlink looped — if referrers to a parent directory. */
export async function isSymLooped(filepath: string): Promise<boolean> {
    const filepathAbsolute = path.resolve(filepath);
    const dirname = path.dirname(filepathAbsolute);
    const linkPath = await fs.readlink(filepathAbsolute);
    const linkPathAbsolute = path.resolve(dirname, linkPath); // Since `linkPath` can be ".", for example.
    return linkPathAbsolute.includes(dirname);
}

