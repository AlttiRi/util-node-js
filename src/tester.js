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
    constructor(printSuccess = true) {
        this.passed = [];
        this.failed = [];
        this.printSuccess = printSuccess;
        this.num = 0;
    }
    destructible() {
        return {
            eq: this.eq.bind(this),
            report: this.report.bind(this),
        }
    }
    eq(name, result, expected) {
        this.num++;
        const errorLines = new Error().stack.split("\n");
        const match = errorLines[2]?.match(/\d+(?=:\d+$)/);
        const line  = match?.[0] || "";
        const prefix = `[${this.num.toString().padStart(3)}][${line.padStart(4)}]`;
        const quotes = result.toString().match(/^\s|\s$/) || expected.toString().match(/^\s|\s$/);
        const q1 = quotes ? ANSI_GRAY("\"") : " ";
        const q2 = quotes ? ANSI_GRAY("\"") : "";
        const colon = ANSI_GRAY(":");
        if (result === expected) {
            this.passed.push(name);
            if (!this.printSuccess) {
                return;
            }
            console.log(ANSI_GREEN(`${prefix} Test ${name} passed`));
            console.log(`Expected  ${colon} ${q1}${result}${q2}`);
            console.log(`Result    ${colon} ${q1}${result}${q2}`);
            console.log(ANSI_GRAY("---"));
        } else {
            this.failed.push(name);
            console.log(ANSI_RED_BOLD(`${prefix} Test ${name} failed`));
            console.log(`Expected  ${colon} ${q1}${expected}${q2}`);
            console.log(`Result    ${colon} ${q1}${result}${q2}`);
            console.log(ANSI_GRAY("---"));
        }
    }
    report() {
        console.log();
        const c = this.failed.length ? ANSI_RED_BOLD : ANSI_GRAY;
        console.log(c(`Failed: ${this.failed.length.toString().padStart(3)}`));
        console.log(  `Passed: ${this.passed.length.toString().padStart(3)}`);
    }
}
