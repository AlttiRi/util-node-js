import {Dirent} from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import {Stats} from "fs";
import {CountLatch, Semaphore} from "@alttiri/util-js";
import {AsyncBufferQueue} from "./util.js";
import {readLink} from "./filesystem.js";

/**
 * The error object that happens while scanning.
 * @example
 * [Error: EPERM: operation not permitted, scandir "C:\\$Recycle.Bin\\S-1-5-18"] {
 *   errno: -4048,
 *   code: "EPERM",
 *   syscall: "scandir",
 *   path: "C:\\$Recycle.Bin\\S-1-5-18"
 * }
 * [Error: EACCES: permission denied, scandir '/boot/efi'] {
 *   errno: -13,
 *   code: 'EACCES',
 *   syscall: 'scandir',
 *   path: '/boot/efi'
 * }
 * // [note] It is missed for "read" (`createReadStream`) of a folder.
 * [Error: EISDIR: illegal operation on a directory, read] {
 *   errno: -4068,
 *   code: 'EISDIR',
 *   syscall: 'read'
 * }
 */
export interface IOError extends Error {
    syscall: string, // "scandir", "readlink"
    code:    string, // "EPERM"
    errno:   number, // -4048
    path:    string, // "C:\\System Volume Information"
}

type ListEntrySimplifiedTypeExample = {
    path: string,
    dirent?: Dirent,
    stats?: Stats,
    link?: LinkInfo
    errors?: {
        [name in "readdir" | "stats" | "readlink"]?: IOError
    },
};

export type LinkInfo = {
    pathTo: string,
    content: string,
}
type DirError  = { readdir:  IOError };
type StatError = { stats:    IOError };
type LinkError = { readlink: IOError };
export type ListEntryDirentError = {
    path: string,
    dirent: Dirent,
    errors: DirError,
}
export type ListEntryDirent = {
    path: string,
    dirent: Dirent,
}
export type ListEntryBase = ListEntryDirent | ListEntryDirentError;


export type LinkEntry = { link: LinkInfo };
export type LinkEntryError = { errors: LinkError };
export type LinkEntryBase = LinkEntry | LinkEntryError;
export type ListEntryDirentLink = ListEntryDirent & LinkEntryBase;

export type ListEntryBaseEx = ListEntryBase | ListEntryDirentLink;

export type StatEntry = { stats: Stats };
export type StatEntryError = { errors: StatError };
export type StatEntryBase = StatEntry | StatEntryError;
export type ListEntryStats = StatEntryBase & ListEntryBaseEx;


const map = new Map<Object, Dirent[]>();

function toListEntryStatsError(entry: ListEntryBaseEx, err: IOError): ListEntryStats {
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

/** An entry of the listing of the content of a directory. */
export type FileListingSetting = {
    /** filepath of a directory to list */
    filepath: string,          // process.cwd()
    recursively: boolean,      // true
    yieldDir: boolean,         // false
    yieldRoot: boolean,        // true
    /** travel strategy */
    depthFirst: boolean,       // true
    /** breadth first strategy for the root folder (if `depthFirst` is `true`) */
    breadthFirstRoot: boolean, // false
    _currentDeep: number,      // 0
    stats: boolean,            // true
    /** The count of `fs.stats` executed in parallel */
    parallels: number,         // 4
};
export type FileListingSettingInit = Partial<FileListingSetting>;

const defaultFileListingSetting: FileListingSetting = {
    filepath:         process.cwd(),
    recursively:      true,
    yieldDir:         false,
    yieldRoot:        true,
    depthFirst:       true,
    breadthFirstRoot: false,
    _currentDeep:     0,
    stats:            true,
    parallels:        4,
    // maxDeep: 0, // todo
    // followSymbol: false,  // if a loop? // if other hard drive? //
    // yieldErrors:  true,   // does it need?
};


function toListEntryDirent(dirEntry: Dirent, settings: FileListingSetting): ListEntryDirent {
    const entryFilepath = path.resolve(settings.filepath, dirEntry.name);
    return {
        path: entryFilepath,
        dirent: dirEntry
    };
}


export function listFiles(initSettings: FileListingSettingInit & {stats: false}): AsyncGenerator<ListEntryBaseEx>;
export function listFiles(initSettings: FileListingSettingInit): AsyncGenerator<ListEntryStats>;

/**
 * Not follows symlinks.
 */
export async function *listFiles(initSettings: FileListingSettingInit = {}): AsyncGenerator<ListEntryBaseEx> {
    const settings: FileListingSetting = Object.assign({...defaultFileListingSetting}, initSettings);
    const rootEntry: ListEntryStats = await getRootEntry(settings.filepath);

    if (settings.yieldRoot) {
        if (!rootEntry.dirent.isDirectory() || settings.yieldDir) {
            yield rootEntry;
        }
    }

    if (settings.stats) {
        yield *_listFilesWithStat(settings, rootEntry);
    } else {
        yield *_listFiles(settings, rootEntry);
    }
}


async function linkInfo(entry: ListEntryDirent): Promise<ListEntryDirent | ListEntryDirentLink> {
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

function toListEntryDirentError(error: IOError, listEntry: ListEntryDirent): ListEntryDirentError {
    return {
        ...listEntry,
        errors: {
            readdir: error
        }
    };
}

async function direntsToEntries(dirents: Dirent[], settings: FileListingSetting): Promise<(ListEntryDirent | ListEntryDirentLink)[]> {
    const listEntries: (ListEntryDirent | ListEntryDirentLink)[] = [];
    for (const dirEntry of dirents) {
        const entryDirent: ListEntryDirent = toListEntryDirent(dirEntry, settings);
        if (entryDirent.dirent.isSymbolicLink()) {
            listEntries.push(await linkInfo(entryDirent));
        } else
        if (entryDirent.dirent.isDirectory()) {
            try {
                const dirEntries: Dirent[] = await fs.readdir(entryDirent.path, {withFileTypes: true});
                listEntries.push(entryDirent);
                map.set(entryDirent, dirEntries);
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

async function *_listFiles(settings: FileListingSetting, listEntry: ListEntryDirent): AsyncGenerator<ListEntryBaseEx> {
    const rootEntry = map.get(listEntry);
    if (!rootEntry) {
        return;
    }
    const listEntries = await direntsToEntries(rootEntry, settings);
    map.delete(listEntry);

    if (settings.depthFirst) {
        if (settings.breadthFirstRoot && settings._currentDeep === 0) {
            yield *depthBreadthFirstList(settings, listEntries);
        } else {
            yield *depthFirstList(settings, listEntries);
        }
    } else {
        yield *breadthFirstList(settings, listEntries);
    }
}

async function *depthFirstList(settings: FileListingSetting, listEntries: ListEntryDirent[]): AsyncGenerator<ListEntryBase> {
    for (const listEntry of listEntries) {
        if (!listEntry.dirent.isDirectory()) {
            yield listEntry;
        } else {
            if (settings.yieldDir) {
                yield listEntry;
            }
            if (settings.recursively) {
                const _currentDeep = settings._currentDeep + 1;
                yield *_listFiles({...settings, _currentDeep, filepath: listEntry.path}, listEntry);
            }
        }
    }
}

/** Yields all directory's entries and only then goes to deep. */
async function *depthBreadthFirstList(settings: FileListingSetting, listEntries: ListEntryDirent[]): AsyncGenerator<ListEntryBase> {
    let queue: ListEntryBase[] = [];
    const _currentDeep = settings._currentDeep + 1;
    for (const listEntry of listEntries) {
        if (!listEntry.dirent.isDirectory()) {
            yield listEntry;
        } else {
            if (settings.yieldDir) {
                yield listEntry;
            }
            if (settings.recursively) {
                queue.push(listEntry);
            }
        }
    }
    for (const listEntry of queue) {
        yield *_listFiles({...settings, _currentDeep, filepath: listEntry.path}, listEntry);
    }
}

async function *breadthFirstList(settings: FileListingSetting, listEntries: ListEntryDirent[]): AsyncGenerator<ListEntryBase> {
    let queue: ListEntryBase[] = [];
    let _currentDeep = settings._currentDeep;

    for (const listEntry of listEntries) {
        if (listEntry.dirent.isDirectory()) {
            if (settings.recursively) {
                queue.push(listEntry);
            }
            if (settings.yieldDir) {
                yield listEntry;
            }
        } else {
            yield listEntry;
        }
    }

    while (queue.length) {
        _currentDeep++;
        queue = yield *list(queue, _currentDeep);
    }

    async function *list(queue: ListEntryBase[], _currentDeep: number) {
        const nextLevelQueue: ListEntryBase[] = [];
        let entry: ListEntryBase | undefined;
        while (entry = queue.shift()) {
            for await (const listEntry of _listFiles({
                ...settings,
                filepath: entry.path,
                recursively: false,
                _currentDeep
            }, entry)) {
                if ("errors" in listEntry) {
                    yield listEntry;
                    continue;
                }
                if (listEntry.dirent.isDirectory()) {
                    if (settings.yieldDir) {
                        yield listEntry;
                    }
                    nextLevelQueue.push(listEntry);
                } else {
                    yield listEntry;
                }
            }
        }
        return nextLevelQueue;
    }
}

export async function *_listFilesWithStat(settings: FileListingSetting, listEntries: ListEntryDirent): AsyncGenerator<ListEntryStats> {
    const mutex     = new Semaphore();
    const semaphore = new Semaphore(settings.parallels);
    const queue = new AsyncBufferQueue<ListEntryStats>(256);
    void (async function startAsyncIterationAsync() {
        const countLatch = new CountLatch();
        for await (const entry of _listFiles(settings, listEntries)) {
            await semaphore.acquire();
            void (async function getStats() {
                countLatch.countUp();
                const takeMutex = mutex.acquire();
                let statEntry: ListEntryStats;
                try {
                    const stats = await fs.lstat(entry.path);
                    statEntry = {...entry, stats};
                } catch (err) {
                    statEntry = toListEntryStatsError(entry, err);
                }
                semaphore.release();
                await takeMutex;
                await queue.enqueue(statEntry);
                mutex.release();
                countLatch.countDown();
            })();
        }
        await countLatch;
        queue.close();
    })();
    yield *queue;
}

/** 100 lines of code to handle edge cases to create the root entry */
async function getRootEntry(filepath: string): Promise<ListEntryStats> {
    let dirents: Dirent[] = [];
    filepath = path.resolve(filepath);
    let stats: Stats;

    try {
        stats = await fs.lstat(filepath);
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
            map.set(result, dirents);
        }

        return result;
    }

    const direntLike = direntFromStats(stats, filepath);
    let result: ListEntryStats = {
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
        map.set(result, dirents);
    }
    return result;

    function direntFromStats(stats: Stats, filepath: string) {
        return new Proxy({
            name: path.basename(filepath),
            path: filepath,
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

    function dummyDirent(filepath: string, isDir = false) {
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
