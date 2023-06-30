import crypto from "node:crypto";
import {getFileInfo, listFiles} from "../index.js";

// console.log(await getFileInfo("C:\\Documents and Settings"));
// C:\System Volume Information

console.time("listFiles");
// const filepath = "C:\\System Volume Information";
const filepath = "../";
let total = 0;
let count = 0;
const skipLog = true;
const hasher = crypto.createHash("md5");
for await (const entry of listFiles({
    filepath,
    yieldDirectories: true,
    depthFirst: false,
    // stats: false
})) {
    count++;
    hasher.update(entry.path);
    if ("stats" in entry && !entry.stats.isDirectory()) {
        total += entry.stats.size;
    }

    // console.log(entry.path);

    if ("errors" in entry)
        console.log(entry);
    if (skipLog) {
        continue;
    }

    console.log("---", entry.path);
    console.log(entry.dirent.name);

    if (!("errors" in entry)) {
        console.log(entry.path);
        console.log(entry.dirent.name);
        if ("link" in entry) {
            console.log(entry.link.content);
        }
    }

    if ("stats" in entry) {
        console.log(entry.stats.size);
    } else {
        console.log(entry.errors.stats.message);
    }
}
console.log({total, count});
console.log(hasher.digest("hex"));
console.timeEnd("listFiles");

