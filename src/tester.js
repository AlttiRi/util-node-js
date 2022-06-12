import {ANSI_GRAY, ANSI_GREEN, ANSI_RED_BOLD} from "./console-colors.js";

/**
 * A pretty simple tester.
 * @example
 * const {eq, report} = new Tester().destructible();
 *
 * eq("ab0", Math.max(1, 2), 2);
 * eq("ab1", " qwe  ".trim(), "qwe");
 *
 * report();
 */
export class Tester {
    constructor() {
        this.passed = [];
        this.failed = [];
    }
    destructible() {
        return {
            eq: this.eq.bind(this),
            report: this.report.bind(this),
        }
    }
    eq(name, result, expected) {
        const quotes = result.toString().match(/^\s|\s$/) || expected.toString().match(/^\s|\s$/);
        const q1 = quotes ? ANSI_GRAY("\"") : " ";
        const q2 = quotes ? ANSI_GRAY("\"") : "";
        if (result === expected) {
            this.passed.push(name);
            console.log(ANSI_GREEN(`Test ${name} passed`));
            console.log(`Result   : ${q1}${result}${q2}`);
            console.log(`Expected : ${q1}${result}${q2}`);
            console.log("---");
        } else {
            this.failed.push(name);
            console.log(ANSI_RED_BOLD(`Test ${name} failed`));
            console.log(`Result   : ${q1}${result}${q2}`);
            console.log(`Expected : ${q1}${expected}${q2}`);
            console.log("---");
        }
    }
    report() {
        console.log();
        console.log(`Failed ${this.failed.length}`);
        console.log(`Passed ${this.passed.length}`);
    }
}
