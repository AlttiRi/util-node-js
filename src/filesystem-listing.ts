import {Dirent} from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

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
 * [Error: EISDIR: illegal operation on a directory, read] {
 *   errno: -4068,
 *   code: 'EISDIR',
 *   syscall: 'read'
 * }
 */
export interface IOError extends Error {
    syscall: string, // "scandir", "readlink", ..., "read"
    code:    string, // "EPERM", ..., "EISDIR"
    errno:   number, // -4048, ..., -4068
    path?:   string, // "C:\\System Volume Information", ..., is missed for "read" (`createReadStream`) of a folder
}

/** An entry of the listing of the content of a directory. */
export type ListEntry = {
    path: string,
    dirent: Dirent,
};
export type ListEntryError = {
    path: string,
    error: IOError,
};
export type ListEntryMix = ListEntry | ListEntryError;

/** An entry of the listing of the content of a directory. */
export type FileListingSetting<YE extends boolean> = {
    /** filepath of a directory to list */
    filepath: string,          // process.cwd()
    recursively: boolean,      // true
    yieldDirectories: boolean, // false
    yieldErrors: YE,           // false
    /** travel strategy */
    depthFirst: boolean,       // true
    /** breadth first strategy for the root folder (if `depthFirst` is `true`) */
    breadthFirstRoot: boolean, // false
    _currentDeep: number,      // 0
};
export type FileListingSettingInit<YE extends boolean> = Partial<FileListingSetting<YE>>;

const defaultFileListingSetting: FileListingSetting<false> = {
    filepath:         process.cwd(),
    recursively:      true,
    yieldDirectories: false,
    yieldErrors:      false,
    depthFirst:       true,
    breadthFirstRoot: false,
    _currentDeep:     0,
    // maxDeep: 0, // todo
    // followSymbol: false,  // [unused] // if a loop? // if other hard drive? //
};


function toListEntry(dirEntry: Dirent, settings: FileListingSetting<boolean>): ListEntry {
    const entryFilepath = path.resolve(settings.filepath, dirEntry.name);
    return {
        path: entryFilepath,
        dirent: dirEntry
    };
}
function toListEntryError(error: IOError, settings: FileListingSetting<true>): ListEntryError {
    return {
        path: settings.filepath,
        error
    };
}


export function listFiles(initSettings: FileListingSettingInit<true>): AsyncGenerator<ListEntryMix>;
export function listFiles(initSettings: FileListingSettingInit<false>): AsyncGenerator<ListEntry>;

/**
 * Not follows symlinks.
 * May return an entry with readdir error (entry type is folder) if `yieldErrors` is `true`.
 */
export async function *listFiles(initSettings: FileListingSettingInit<boolean> = {}): AsyncGenerator<ListEntryMix> {
    const settings: FileListingSetting<boolean> = Object.assign({...defaultFileListingSetting}, initSettings);
    yield *_listFiles(settings);
}


async function *_listFiles(settings: FileListingSetting<boolean>): AsyncGenerator<ListEntryMix> {
    try {
        const dirEntries: Dirent[] = await fs.readdir(settings.filepath, { // can throw an error
            withFileTypes: true
        });
        const listEntries: ListEntry[] = dirEntries.map(dirEntry => toListEntry(dirEntry, settings));
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
            yield toListEntryError(error, settings as FileListingSetting<true>);
        }
    }
}

async function *depthFirstList(settings: FileListingSetting<boolean>, listEntries: ListEntry[]): AsyncGenerator<ListEntryMix> {
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
async function *depthBreadthFirstList(settings: FileListingSetting<boolean>, listEntries: ListEntry[]): AsyncGenerator<ListEntryMix> {
    let queue: ListEntry[] = [];
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

async function *breadthFirstList(settings: FileListingSetting<boolean>, listEntries: ListEntry[]): AsyncGenerator<ListEntryMix> {
    let queue: ListEntry[] = [];
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

    async function *list(queue: ListEntry[], _currentDeep: number) {
        const nextLevelQueue: ListEntry[] = [];
        let entry: ListEntry | undefined;
        while (entry = queue.shift()) {
            for await (const listEntry of _listFiles({
                ...settings,
                filepath: entry.path,
                recursively: false,
                _currentDeep
            })) {
                if ("error" in listEntry) {
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