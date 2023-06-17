import fs from "node:fs/promises";
import path from "node:path";
import {Stats} from "fs";


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


export type FileInfo = {
    path: string,
    stats: Stats,
    link?: LinkInfo,
};
export type LinkInfo = {
    pathTo: string,
    content: string,
};

export async function getFileInfo(filepath: string): Promise<FileInfo> {
    filepath = path.resolve(filepath);
    const stats = await fs.lstat(filepath);

    let link;
    if (stats.isSymbolicLink()) {
        const symContent = await fs.readlink(filepath);
        const linkLocation = path.dirname(filepath);
        const absolutePathTo = path.resolve(linkLocation, symContent);
        link = {
            pathTo: absolutePathTo,
            content: symContent,
        };
    }

    return {
        path: filepath,
        stats: stats,
        ...(link ? {link} : {})
    };
}
