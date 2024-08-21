# util-node-js

Some Node.js util functions. 

Mostly it's a draft version for personal use.

## util functions
```ts
type ANSIColor = "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white";
type ColoringFunc = (text: any) => string;
/**
 * [ANSI_escape_code#SGR]{@link https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_(Select_Graphic_Rendition)_parameters}
 * \```
 * "32" - Green [ANSI]
 * "36" - Cyan  [ANSI]
 * "38;5;208" - Orange #ff8700 [8-bit]
 * "38;5;99"  - Violet #875fff [8-bit]
 * "38;2;173;255;47" - Green-Yellow #adff2f [24-bit]
 * \```
 * @example
 * const COL_VIOLET_DARK = getColoring("38;5;92");
 * console.log(COL_VIOLET_DARK("This text is 8-bit dark violet"));
 *
 * @param {string} mode
 * @return {ColoringFunc}
 */
export declare function getColoring(mode: string): ColoringFunc;
export type AnsiColoringOpts = {
    bright?: boolean;
    bold?: boolean;
};
/**
 * @example
 * const ANSI_RED_BOLD = getAnsiColoring("RED", {bold: true});
 * console.log(ANSI_RED_BOLD("This text is bold red"));
 * @param {ANSIColor?} color = "white"
 * @param {AnsiColoringOpts?} opts
 * @param {boolean?} opts.bright = false
 * @param {boolean?} opts.bold   = false
 * @return {ColoringFunc}
 */
export declare function getAnsiColoring(color?: ANSIColor, opts?: AnsiColoringOpts): ColoringFunc;

export declare const ANSI_BLUE: (text: any) => string;
export declare const ANSI_CYAN: (text: any) => string;
export declare const ANSI_GREEN: (text: any) => string;
export declare const ANSI_GRAY: (text: any) => string;
export declare const ANSI_GREEN_BOLD: (text: any) => string;
export declare const ANSI_RED_BOLD: (text: any) => string;
export declare const COL_ORANGE: (text: any) => string;
export declare const COL_VIOLET: (text: any) => string;
export declare const COL_GRAY: (text: any) => string;

export declare const saveCursorPosition: () => boolean;
export declare const restoreCursorPosition: () => boolean;
export declare const eraseCursorLine: () => boolean;
export declare const moveCursorToTop: (num?: number) => boolean;
export declare function stdWrite(text: string): Promise<void>;

export declare function exists(path: string, followSymbol?: boolean): Promise<boolean>;
/** Is the passed symlink looped — if referrers to a parent directory. */
export declare function isSymLooped(filepath: string): Promise<boolean>;
type FileInfo = {
    path: string;
    stats: Stats;
    link?: LinkInfo;
};
type LinkInfo = {
    pathTo: string;
    content: string;
};
export declare function getFileInfo(filepath: string): Promise<FileInfo>;
export declare function readLink(filepath: string): Promise<{
    pathTo: string;
    content: string;
}>;

export type ConstructorOpts = {
    printSuccess?: boolean;
    testOnly?: number[];
    stackDeep?: number;
    autoReport?: boolean;
};
export type TestOpts = {
    result: any;
    expect: any;
    stackDeep?: number;
    name?: string;
    printLink?: boolean;
    autoReport?: boolean;
    printSuccess?: boolean;
};
export type TesterMethods = {
    /** @deprecated */
    eq(name: string, result: any, expect: any): void;
    t(opt: TestOpts): void;
    report(): void;
};
export declare class Tester {
    private readonly passed;
    private readonly failed;
    private readonly printSuccess;
    private num;
    private readonly testOnly;
    private readonly stackDeep;
    private timerId;
    private readonly autoReport;
    /** @deprecated */
    eq(name: string, result: any, expect: any): void;
    destructible(): TesterMethods;
    constructor(opt?: ConstructorOpts);
    t(opt: TestOpts): void;
    private delayReport;
    report(): void;
}
export type LineNumType = {
    relFilePath: string;
    lineNum?: string;
    column?: string;
};
```

## fs-list
```ts
export declare function toListEntryDirent(dirEntry: Dirent, settings: FileListingSetting): ListEntryDirent;
export declare function toListEntryDirentError(error: IOError, listEntry: ListEntryDirent): ListEntryDirentError;
export declare function toLinkInfo(entry: ListEntryDirent): Promise<ListEntryDirent | ListEntryDirentLink>;
export declare function toListEntryStatsError(entry: ListEntryBaseEx, err: IOError): ListEntryStats;
export declare function direntsToEntries(dirents: Dirent[], settings: FileListingSetting): Promise<(ListEntryDirent | ListEntryDirentLink)[]>;
/** 100 lines of code to handle edge cases to create the root entry */
export declare function getRootEntry({ filepath, _map, bigint }: FileListingSetting): Promise<ListEntryStatsAny>;

export declare function listFiles(initSettings: FileListingSettingInit & {
    stats: false;
}): AsyncGenerator<ListEntryBaseEx>;
export declare function listFiles(initSettings: FileListingSettingInit & {
    bigint: true;
}): AsyncGenerator<ListEntryStatsBigInt>;

/**
 Returns an object:
\```ts
{
    path: string,
    dirent: Dirent,
    stats?: Stats | BigIntStats,
    link?: LinkInfo,
    errors?: {
        [name in "readdir" | "stats" | "readlink"]?: IOError
    },
}
\```
The return object's keys info:
\```
- path   — `string`.
    The full path with the filename.

- dirent — `Dirent`.
     A `Dirent` from `fs.readdir`.
     For the root folder a "fake" `Dirent` is used:
        - "DirentLike"  — created based on `Stats`
        - "DirentDummy" — if there were errors (`errors: {stats, readdir}`)

- stats? — `Stats | BigIntStats`.
    Optional, exists only when the scan option `stats` is `true`.
    Type depends on `bigint` option.
    Is missed if there is `errors.stats` error.

- link? — `LinkInfo`.
    Optional, exists only for symlinks.
    `LinkInfo` is an alias for `{
        pathTo: string,
        content: string,
    }`.
    Is missed if there is `errors.readlink` error.

- errors? — an `object` with `IOError`s.
    Optional, exists only one or more errors occurred.
    Possible errors:
    - "readdir"
    - "stats"
    - "readlink"
\```

@note `listFiles` does not follow symlinks.
@options
\```js
 - filepath:    string  = process.cwd(), // filepath of a (root) directory to list
 - recursively: boolean = true,
 - yieldDir:    boolean = false,
 - yieldRoot:   boolean = true,         // (is used only if `yieldDir` is `true`)
 - depthFirst:  boolean = true,         // travel strategy
 - breadthFirstRoot: boolean = false,   // breadth first strategy for the root folder (if `depthFirst` is `true`)
 - stats:       boolean = true,
 - bigint:      boolean = false,        // (use only if `stats` is `true`)
 - parallels:   number  = 4,            // count of `fs.stats` executed in parallel
\```
*/
export declare function listFiles(initSettings: FileListingSettingInit): AsyncGenerator<ListEntryStats>;

export declare function _listFilesWithStat(settings: FileListingSetting, listEntries: ListEntryDirent): AsyncGenerator<ListEntryStatsAny>;
export type FileListingSettingInit = Partial<FileListingSetting>;
/** An entry of the listing of the content of a directory. */
export type FileListingSetting = {
    /** filepath of a directory to list */
    filepath: string;
    recursively: boolean;
    yieldDir: boolean;
    yieldRoot: boolean;
    /** travel strategy */
    depthFirst: boolean;
    /** breadth first strategy for the root folder (if `depthFirst` is `true`) */
    breadthFirstRoot: boolean;
    stats: boolean;
    bigint: boolean;
    /** The count of `fs.stats` executed in parallel */
    parallels: number;
    _currentDeep: number;
    _map: Map<ListEntryDirent, Dirent[]>;
};
export declare function getDefaultSettings(): FileListingSetting;
```

## fs-list types
```ts
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
    syscall: string;
    code: string;
    errno: number;
    path: string;
}
import { Dirent, BigIntStats, Stats } from "node:fs";
import { IOError } from "./IOError.js";
/**
 * The simplified type example:
 * @example
 * type ListEntrySimplifiedFullType = {
 *     path: string,
 *     dirent: Dirent,
 *     stats?: Stats | BigIntStats,
 *     link?: LinkInfo,
 *     errors?: {
 *         [name in "readdir" | "stats" | "readlink"]?: IOError
 *     },
 * };
 */
export type ListEntryBase = ListEntryDirent | ListEntryDirentError;
export type ListEntryDirent = {
    path: string;
    dirent: Dirent;
};
export type ListEntryDirentError = {
    path: string;
    dirent: Dirent;
    errors: DirError;
};
export type DirError = {
    readdir: IOError;
};
export type StatError = {
    stats: IOError;
};
export type LinkError = {
    readlink: IOError;
};
export type LinkInfo = {
    pathTo: string;
    content: string;
};
export type LinkEntry = {
    link: LinkInfo;
};
export type LinkEntryError = {
    errors: LinkError;
};
export type LinkEntryBase = LinkEntry | LinkEntryError;
export type ListEntryDirentLink = ListEntryDirent & LinkEntryBase;
export type ListEntryBaseEx = ListEntryBase | ListEntryDirentLink;
export type StatEntry = {
    stats: Stats;
};
export type StatEntryBigInt = {
    stats: BigIntStats;
};
export type StatEntryAny = {
    stats: Stats | BigIntStats;
};
export type StatEntryError = {
    errors: StatError;
};
export type StatEntryBase = StatEntry | StatEntryError;
export type StatEntryBaseBigInt = StatEntryBigInt | StatEntryError;
export type StatEntryBaseAny = StatEntryAny | StatEntryError;
export type ListEntryStats = StatEntryBase & ListEntryBaseEx;
export type ListEntryStatsBigInt = StatEntryBaseBigInt & ListEntryBaseEx;
export type ListEntryStatsAny = StatEntryBaseAny & ListEntryBaseEx;
```

## Installation

### From NPM

```bash
npm install @alttiri/util-node-js
```

<details>

<summary>From GitHub Packages</summary>


### From GitHub Packages:
To install you need first to create `.npmrc` file with `@alttiri:registry=https://npm.pkg.github.com` content:
```bash
echo @alttiri:registry=https://npm.pkg.github.com >> .npmrc
```

only then run

```bash
npm install @alttiri/util-node-js
```
Note, that GitHub Packages requires to have also `~/.npmrc` file (`.npmrc` in your home dir) with `//npm.pkg.github.com/:_authToken=TOKEN` content, where `TOKEN` is a token with the `read:packages` permission, take it here https://github.com/settings/tokens/new. 

</details>
