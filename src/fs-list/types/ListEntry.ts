import {Dirent, BigIntStats, Stats} from "node:fs";
import {IOError} from "./IOError";

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
    path: string,
    dirent: Dirent,
}
export type ListEntryDirentError = {
    path: string,
    dirent: Dirent,
    errors: DirError,
}

export type DirError  = { readdir:  IOError };
export type StatError = { stats:    IOError };
export type LinkError = { readlink: IOError };

export type LinkInfo = {
    pathTo: string,
    content: string,
};

export type LinkEntry      = { link:   LinkInfo };
export type LinkEntryError = { errors: LinkError };
export type LinkEntryBase = LinkEntry | LinkEntryError;
export type ListEntryDirentLink = ListEntryDirent & LinkEntryBase;

export type ListEntryBaseEx = ListEntryBase | ListEntryDirentLink;

export type StatEntry       = { stats:  Stats };
export type StatEntryBigInt = { stats:  BigIntStats };
export type StatEntryAny    = { stats:  Stats | BigIntStats};
export type StatEntryError  = { errors: StatError };
export type StatEntryBase       = StatEntry       | StatEntryError;
export type StatEntryBaseBigInt = StatEntryBigInt | StatEntryError;
export type StatEntryBaseAny    = StatEntryAny    | StatEntryError;
export type ListEntryStats       = StatEntryBase       & ListEntryBaseEx;
export type ListEntryStatsBigInt = StatEntryBaseBigInt & ListEntryBaseEx;
export type ListEntryStatsAny    = StatEntryBaseAny    & ListEntryBaseEx;
