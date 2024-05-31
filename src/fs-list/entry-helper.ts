import fs from "node:fs/promises";
import path from "node:path";
import {BigIntStats, Dirent} from "node:fs";
import {Stats} from "fs";
import {
    DirError,
    LinkInfo,
    ListEntryBaseEx,
    ListEntryDirent,
    ListEntryDirentError,
    ListEntryDirentLink,
    ListEntryStats, ListEntryStatsAny, StatError
} from "./types/ListEntry";
import {IOError} from "./types/IOError";
import {FileListingSetting} from "./settings";
import {readLink} from "../filesystem";


export function toListEntryDirent(dirEntry: Dirent, settings: FileListingSetting): ListEntryDirent {
    const entryFilepath = path.resolve(settings.filepath, dirEntry.name);
    return {
        path: entryFilepath,
        dirent: dirEntry
    };
}

export function toListEntryDirentError(error: IOError, listEntry: ListEntryDirent): ListEntryDirentError {
    return {
        ...listEntry,
        errors: {
            readdir: error
        }
    };
}


export async function toLinkInfo(entry: ListEntryDirent): Promise<ListEntryDirent | ListEntryDirentLink> {
    if (!entry.dirent.isSymbolicLink()) {
        return entry;
    }
    try {
        const link: LinkInfo = await readLink(entry.path);
        return {
            ...entry,
            link
        };
    } catch (err) {
        return {
            ...entry,
            errors: {
                readlink: err
            }
        };
    }
}


export function toListEntryStatsError(entry: ListEntryBaseEx, err: IOError): ListEntryStats {
    if ("errors" in entry) {
        return {
            ...entry,
            errors: {
                ...entry.errors,
                stats: err
            }
        } as ListEntryStats;
    } else {
        return {
            ...entry,
            errors: {
                stats: err
            }
        };
    }
}


export async function direntsToEntries(dirents: Dirent[], settings: FileListingSetting): Promise<(ListEntryDirent | ListEntryDirentLink)[]> {
    const listEntries: (ListEntryDirent | ListEntryDirentLink)[] = [];
    for (const dirEntry of dirents) {
        const entryDirent: ListEntryDirent = toListEntryDirent(dirEntry, settings);
        if (entryDirent.dirent.isSymbolicLink()) {
            listEntries.push(await toLinkInfo(entryDirent));
        } else
        if (entryDirent.dirent.isDirectory()) {
            try {
                const dirEntries: Dirent[] = await fs.readdir(entryDirent.path, {withFileTypes: true});
                listEntries.push(entryDirent);
                settings._map.set(entryDirent, dirEntries);
            } catch (error) {
                const errorEntry = toListEntryDirentError(error, entryDirent);
                listEntries.push(errorEntry);
            }
        } else {
            listEntries.push(entryDirent);
        }
    }
    return listEntries;
}


/** 100 lines of code to handle edge cases to create the root entry */
export async function getRootEntry({filepath, _map, bigint}: FileListingSetting): Promise<ListEntryStatsAny> {
    let dirents: Dirent[] = [];
    filepath = path.resolve(filepath);
    let stats: Stats | BigIntStats;









    try {
        stats = await fs.lstat(filepath, {bigint});
    } catch (err) {
        let direntDummy = dummyDirent(filepath);
        let errors: StatError | StatError & DirError = {
            stats: err as IOError,
        };
        try {
            dirents = await fs.readdir(filepath, {withFileTypes: true});
            direntDummy = dummyDirent(filepath, true);
        } catch (err) {
            errors = {
                ...errors,
                readdir: err as IOError
            };
        }
        const result: ListEntryStats =  {
            path: filepath,
            dirent: direntDummy,
            errors,
        };
        if (dirents.length) {
            _map.set(result, dirents);
        }

        return result;
    }

    const direntLike = direntFromStats(stats, filepath);
    let result: ListEntryStatsAny = {
        path: filepath,
        dirent: direntLike,
        stats,
    };
    if (stats.isDirectory()) {
        try {
            dirents = await fs.readdir(filepath, {withFileTypes: true});
        } catch (err) {
            result = {
                ...result,
                errors: {
                    readdir: err as IOError
                }
            };
        }
    } else
    if (stats.isSymbolicLink()) {
        try {
            const link: LinkInfo = await readLink(filepath);
            result = {
                ...result,
                link,
            }
        } catch (err) {
            result = {
                ...result,
                errors: {
                    readlink: err as IOError,
                }
            }
        }
    }
    if (dirents.length) {
        _map.set(result, dirents);
    }
    return result;

    function direntFromStats(stats: Stats | BigIntStats, filepath: string): Dirent {
        return new Proxy({
            name: path.basename(filepath),
            path: path.dirname(filepath),
            [Symbol.toStringTag]: "DirentLike",
        }, {
            get(target: any, property: keyof Stats) {
                if (property in stats) {
                    return stats[property];
                }
                return target[property];
            }
        }) as Dirent;
    }

    function dummyDirent(filepath: string, isDir = false): Dirent {
        const direntDummy = new Dirent();
        direntDummy.name = path.basename(filepath);
        (direntDummy as any)[Symbol.toStringTag] = "DirentDummy";
        (direntDummy as any).path = filepath;
        if (isDir) {
            direntDummy.isDirectory = () => true;
        }
        return direntDummy;
    }
}
