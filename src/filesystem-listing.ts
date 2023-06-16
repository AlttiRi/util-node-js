import {Dirent} from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import {Stats} from "fs";
import {CountLatch, Semaphore} from "@alttiri/util-js";
import {AsyncBufferQueue} from "./util.js";

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

type ErrorName = "dirent" | "stats";
/** An entry of the listing of the content of a directory. */
export type ListEntry = { // Template
    path: string,
    dirent?: Dirent,
    stats?: Stats,
    errors?: {
        [name in ErrorName]?: IOError
    },
};

export type ListEntryDirent = {
    path: string,
    dirent: Dirent,
}
type DirentError = { dirent: IOError };
type StatError   = { stats:  IOError };
export type ListEntryDirentError = {
    path: string,
    errors: DirentError,
}
export type ListEntryBase = ListEntryDirent | ListEntryDirentError;

export type StatEntry = {stats: Stats};
export type StatEntryError = {errors: StatError};
export type StatEntryBase = StatEntry | StatEntryError;
export type ListEntryStats = StatEntryBase & (ListEntryDirent | ListEntryDirentError);
export type ListEntryStatsExtended =
      {path: string, dirent: Dirent, stats: Stats}
    | {path: string, dirent: Dirent, errors: { stats: IOError }}
    | {path: string, stats: Stats, errors: { dirent: IOError }}
    | {path: string, errors: { dirent: IOError, stats: IOError }}

function toListEntryStatsError(entry: ListEntryBase, err: IOError): ListEntryStats {
    if ("errors" in entry) {
        return {
            path: entry.path,
            errors: {
                dirent: entry.errors.dirent,
                stats: err
            }
        }
    } else {
        return {
            path: entry.path,
            dirent: entry.dirent,
            errors: {
                stats: err
            }
        }
    }
}

/** An entry of the listing of the content of a directory. */
export type FileListingSetting = {
    /** filepath of a directory to list */
    filepath: string,          // process.cwd()
    recursively: boolean,      // true
    yieldDirectories: boolean, // false
    yieldErrors: boolean,      // false
    /** travel strategy */
    depthFirst: boolean,       // true
    /** breadth first strategy for the root folder (if `depthFirst` is `true`) */
    breadthFirstRoot: boolean, // false
    _currentDeep: number,      // 0
};
export type FileListingSettingInit = Partial<FileListingSetting>;

const defaultFileListingSetting: FileListingSetting = {
    filepath:         process.cwd(),
    recursively:      true,
    yieldDirectories: false,
    yieldErrors:      false,
    depthFirst:       true,
    breadthFirstRoot: false,
    _currentDeep:     0,
    // yieldRoot: true, // todo
    // maxDeep: 0, // todo
    // followSymbol: false,  // [unused] // if a loop? // if other hard drive? //
};


function toListEntryDirent(dirEntry: Dirent, settings: FileListingSetting): ListEntryDirent {
    const entryFilepath = path.resolve(settings.filepath, dirEntry.name);
    return {
        path: entryFilepath,
        dirent: dirEntry
    };
}
function toListEntryDirentError(error: IOError, settings: FileListingSetting): ListEntryDirentError {
    return {
        path: settings.filepath,
        errors: {
            dirent: error
        }
    };
}


/**
 * Not follows symlinks.
 * May return an entry with readdir error (entry type is folder) if `yieldErrors` is `true`.
 */
export async function *listFiles(initSettings: FileListingSettingInit = {}): AsyncGenerator<ListEntryBase> {
    const settings: FileListingSetting = Object.assign({...defaultFileListingSetting}, initSettings);
    yield *_listFiles(settings);
}

async function *_listFiles(settings: FileListingSetting): AsyncGenerator<ListEntryBase> {
    try {
        const dirEntries: Dirent[] = await fs.readdir(settings.filepath, { // can throw an error
            withFileTypes: true
        });
        const listEntries: ListEntryDirent[] = dirEntries.map(dirEntry => toListEntryDirent(dirEntry, settings));
        if (settings.depthFirst) {
            if (settings.breadthFirstRoot && settings._currentDeep === 0) {
                yield *depthBreadthFirstList(settings, listEntries);
            } else {
                yield *depthFirstList(settings, listEntries);
            }
        } else {
            yield *breadthFirstList(settings, listEntries);
        }
    } catch (error) {
        if (settings.yieldErrors) {
            yield toListEntryDirentError(error, settings);
        }
    }
}

async function *depthFirstList(settings: FileListingSetting, listEntries: ListEntryDirent[]): AsyncGenerator<ListEntryBase> {
    for (const listEntry of listEntries) {
        if (!listEntry.dirent.isDirectory()) {
            yield listEntry;
        } else {
            if (settings.yieldDirectories) {
                yield listEntry;
            }
            if (settings.recursively) {
                const _currentDeep = settings._currentDeep + 1;
                yield *_listFiles({...settings, _currentDeep, filepath: listEntry.path});
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
            if (settings.yieldDirectories) {
                yield listEntry;
            }
            if (settings.recursively) {
                queue.push(listEntry);
            }
        }
    }
    for (const listEntry of queue) {
        yield *_listFiles({...settings, _currentDeep, filepath: listEntry.path});
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
            if (settings.yieldDirectories) {
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
            })) {
                if ("errors" in listEntry) {
                    yield listEntry;
                    continue;
                }
                if (listEntry.dirent.isDirectory()) {
                    if (settings.yieldDirectories) {
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




export async function *listFilesWithStat(conf: FileListingSettingInit): AsyncGenerator<ListEntryStats> {
    const mutex     = new Semaphore();
    const semaphore = new Semaphore(4);
    const queue = new AsyncBufferQueue<ListEntryStats>(256);
    void (async function startAsyncIterationAsync() {
        const countLatch = new CountLatch();
        for await (const entry of listFiles(conf)) {
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
