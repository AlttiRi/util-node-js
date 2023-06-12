import {Tester} from "../src/tester.js";


const {eq, report, t} = new Tester().destructible();

eq("first", "4545", "4545");
eq("second", "asd", "asd");
eq("xxx bad", "asd", "asd1");
report();

console.log("---");
console.log("---");
console.log("---");

t({
    result: 123,
    expect: 123
});
t({
    result: "12356",
    expect: "12356"
});
t({
    result: "qqq",
    expect: "qqq"
});
t({
    result: "qqq",
    expect: "qqq1"
});
