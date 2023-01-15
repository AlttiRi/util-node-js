/**
 * The error object that happens while scanning.
 * @typedef {Object} IOError
 * @property {String} syscall - "scandir", "readlink", ...
 * @property {String} code    - "EPERM", ...
 * @property {Number} errno   - "-4048", ...
 * @property {String} path    - "C:\System Volume Information", ...
 *
 * @example
 * [Error: EPERM: operation not permitted, scandir "C:\\$Recycle.Bin\\S-1-5-18"] {
 *  errno: -4048,
 *  code: "EPERM",
 *  syscall: "scandir",
 *  path: "C:\\$Recycle.Bin\\S-1-5-18"
 * }
 *
 * [Error: EACCES: permission denied, scandir '/boot/efi'] {
 *  errno: -13,
 *  code: 'EACCES',
 *  syscall: 'scandir',
 *  path: '/boot/efi'
 *}
 */

/**
 * An entry of the listing of the content of a directory.
 * @typedef {Object} ListEntry
 * @property {String} path
 * @property {import("fs/promises").Dirent} [dirent]
 * @property {IOError} [error]
 */

/**
 * An entry of the listing of the content of a directory.
 * @typedef {Object} FileListingSetting
 * @property {string}  [filepath = process.cwd()] - filepath of a directory to list
 * @property {boolean} [recursively = true]
 * @property {boolean} [yieldDirectories = false]
 * @property {boolean} [yieldErrors = false]
 * @property {boolean} [depthFirst = true] - travel strategy
 * @property {boolean} [breadthFirstRoot = false] - breadth first strategy for the root folder (if `depthFirst` is `true`)
 * @property {Number}  [_currentDeep = 0]
 */

import fs from "fs/promises";
import path from "path";

/**
 * @param {FileListingSetting} settings
 * @param {import("fs/promises").Dirent} [dirEntry]
 * @param {IOError} [error]
 * @return {ListEntry}
 */
function toListEntry(dirEntry, settings, error) {
    if (error) {
        return {
            path: settings.filepath,
            error
        };
    }
    const entryFilepath = path.resolve(settings.filepath, dirEntry.name);
    return {
        path: entryFilepath,
        dirent: dirEntry
    };
}

/** @type {FileListingSetting} */
const defaultFileListingSetting = {
    filepath: process.cwd(),
    recursively: true,
    // followSymbol: false,  // [unused] // if a loop? // if other hard drive? //
    yieldDirectories: false,
    yieldErrors: false,
    depthFirst: true,
    breadthFirstRoot: false,
    // maxDeep: 0, // todo
    _currentDeep: 0,
};

/**
 * Not follows symlinks.
 * May return an entry with readdir error (entry type is folder) if `yieldErrors` is `true`.
 *
 * @param {FileListingSetting} [settings = {}] - Config object
 * @return {AsyncGenerator<ListEntry>}
 */
export async function *listFiles(settings = {}) {
    settings = Object.assign({...defaultFileListingSetting}, settings);
    try {
        /** @type {import("fs/promises").Dirent[]} */
        const dirEntries = await fs.readdir(settings.filepath, { // can throw an error
            withFileTypes: true
        });
        /** @type {ListEntry[]} */
        const listEntries = dirEntries.map(dirEntry => toListEntry(dirEntry, settings));
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
            yield toListEntry(null, settings, error);
        }
    }
}

/**
 * @param {FileListingSetting} settings
 * @param {ListEntry[]} listEntries
 * @return {AsyncGenerator<ListEntry>}
 */
async function *depthFirstList(settings, listEntries) {
    for (const listEntry of listEntries) {
        if (!listEntry.dirent.isDirectory()) {
            yield listEntry;
        } else {
            if (settings.yieldDirectories) {
                yield listEntry;
            }
            if (settings.recursively) {
                const _currentDeep = settings._currentDeep + 1;
                yield *listFiles({...settings, _currentDeep, filepath: listEntry.path});
            }
        }
    }
}

/**
 * Yields all directory's entries and only then goes to deep.
 * @param {FileListingSetting} settings
 * @param {ListEntry[]} listEntries
 * @return {AsyncGenerator<ListEntry>}
 */
async function *depthBreadthFirstList(settings, listEntries) {
    /** @type {ListEntry[]} */
    let queue = [];
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
        yield *listFiles({...settings, _currentDeep, filepath: listEntry.path});
    }
}


/**
 * @param {FileListingSetting} settings
 * @param {ListEntry[]} listEntries
 * @return {AsyncGenerator<ListEntry>}
 */
async function *breadthFirstList(settings, listEntries) {
    /** @type {ListEntry[]} */
    let queue = [];
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

    async function *list(queue, _currentDeep) {
        /** @type {ListEntry[]} */
        const nextLevelQueue = [];
        /** @type {ListEntry|undefined} */
        let entry;
        while (entry = queue.shift()) {
            for await (const listEntry of listFiles({
                ...settings,
                filepath: entry.path,
                recursively: false,
                _currentDeep
            })) {
                if (listEntry.error) {
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
