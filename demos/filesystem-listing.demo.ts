import {listFiles} from "../src/filesystem-listing.js";

let errors = 0;
let total = 0;
for await (const listEntry of listFiles({
    yieldDirectories: true,
    // yieldErrors: true,
    breadthFirstRoot: true,
    filepath: "./"
})) {
    if ("error" in listEntry) {
        errors++;
    }
    total++;
    console.log(listEntry);
}


console.log(total, errors);
