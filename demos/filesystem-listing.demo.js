import {listFiles} from "../src/filesystem-listing.js";

for await (const listEntry of listFiles({
    yieldDirectories: true,
    yieldErrors: true,
    breadthFirstRoot: true,
    filepath: "./"
})) {
    console.log(listEntry);
}
