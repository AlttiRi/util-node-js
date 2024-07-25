import {Dirent} from "node:fs";
import {ListEntryDirent} from "./types/ListEntry.js";

export type FileListingSettingInit = Partial<FileListingSetting>;

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
    stats: boolean,            // true
    bigint: boolean,           // false
    /** The count of `fs.stats` executed in parallel */
    parallels: number,         // 4

    _currentDeep: number,      // 0
    _map: Map<ListEntryDirent, Dirent[]>,
};

export function getDefaultSettings(): FileListingSetting {
    return {
        filepath:         process.cwd(),
        recursively:      true,
        yieldDir:         false,
        yieldRoot:        true,
        depthFirst:       true,
        breadthFirstRoot: false,
        stats:            true,
        bigint:           false,
        parallels:        4,
        _currentDeep:     0,
        _map: new Map<ListEntryDirent, Dirent[]>(),
        // maxDeep: 0, // todo
        // followSymbol: false,  // if a loop? // if other hard drive? //
        // yieldErrors:  true,   // does it need?
    };
}
