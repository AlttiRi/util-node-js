import {t} from "../src/tester-2.js";
import {Tester} from "../src/tester.js";


const {eq, report} = new Tester().destructible();

eq("first", "4545", "4545");
eq("second", "asd", "asd");
eq("??? bad", "asd", "asd1");
report();



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
