import fs from "node:fs/promises";
import {CountLatch, Semaphore, AsyncBufferQueue} from "@alttiri/util-js";
import {
    direntsToEntries,
    getRootEntry,
    toListEntryStatsError,
} from "./entry-helper.js";
import {FileListingSetting, FileListingSettingInit, getDefaultSettings} from "./settings.js";
import {
    ListEntryDirent,
    ListEntryBase,
    ListEntryBaseEx, // ListEntryDirentLink,
    ListEntryStats, ListEntryStatsBigInt, ListEntryStatsAny,
} from "./types/ListEntry";


export function listFiles(initSettings: FileListingSettingInit & {stats: false}): AsyncGenerator<ListEntryBaseEx>;
export function listFiles(initSettings: FileListingSettingInit & {bigint: true}): AsyncGenerator<ListEntryStatsBigInt>;
export function listFiles(initSettings: FileListingSettingInit): AsyncGenerator<ListEntryStats>;

/** Not follows symlinks. */
export async function *listFiles(initSettings: FileListingSettingInit = {}): AsyncGenerator<ListEntryBaseEx> {
    const settings: FileListingSetting = Object.assign({...getDefaultSettings()}, initSettings);
    const rootEntry: ListEntryStats = await getRootEntry(settings);

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

async function *_listFiles(settings: FileListingSetting, listEntry: ListEntryDirent): AsyncGenerator<ListEntryBaseEx> {
    const dirents = settings._map.get(listEntry);
    if (!dirents) {
        return;
    }
    const listEntries = await direntsToEntries(dirents, settings);
    settings._map.delete(listEntry);

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
                yieldDir: true,
                _currentDeep,
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

export async function *_listFilesWithStat(settings: FileListingSetting, listEntries: ListEntryDirent): AsyncGenerator<ListEntryStatsAny> {
    const mutex     = new Semaphore();
    const semaphore = new Semaphore(settings.parallels);
    const queue = new AsyncBufferQueue<ListEntryStatsAny>(256);
    void (async function startAsyncIterationAsync() {
        const countLatch = new CountLatch();
        for await (const entry of _listFiles(settings, listEntries)) {
            await semaphore.acquire();
            void (async function getStats() {
                countLatch.countUp();
                const takeMutex = mutex.acquire();
                let statEntry: ListEntryStatsAny;
                try {
                    const stats = await fs.lstat(entry.path, {bigint: settings.bigint});
                    statEntry = {...entry, stats} as ListEntryStatsAny;
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
