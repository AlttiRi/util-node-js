import {Tester} from "@/index";


const {eq, report, t} = new Tester().destructible();

eq("first", "4545", "4545");
eq("second", "asd", "asd");
eq("xxx bad", "asd", "asd1"); /* will fail */
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
/* will fail */ t({
    result: "qqq",
    expect: "qqq1"
});
