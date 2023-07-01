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
