import {ANSI_BLUE, ANSI_GRAY, ANSI_GREEN_BOLD, ANSI_RED_BOLD} from "./console-colors.js";


export type ConstructorOpts = {
    printSuccess?: boolean,
    testOnly?:     number[],
    stackDeep?:    number,
    autoReport?:   boolean,
};

export type TestOpts = {
    result: any,
    expect: any,
    stackDeep?: number,
    name?: string,
    printLink?: boolean,
    autoReport?: boolean,
    printSuccess?: boolean,
};

export type TesterMethods = {
    /** @deprecated */
    eq(name: string, result: any, expect: any): void,
    t(opt: TestOpts): void,
    report(): void,
};



export class Tester {
    private readonly passed: number[];
    private readonly failed: number[];
    private readonly printSuccess: boolean;
    private          num:    number;
    private readonly testOnly:   number[];
    private readonly stackDeep:  number;
    private          timerId:    number | NodeJS.Timeout;
    private readonly autoReport: boolean;

    /** @deprecated */
    eq(name: string, result: any, expect: any) {
        return this.t({
            result, expect, name,
            autoReport: false, stackDeep: 1, printSuccess: true,
        });
    }

    destructible(): TesterMethods {
        return {
            eq: this.eq.bind(this),
            t: this.t.bind(this),
            report: this.report.bind(this),
        }
    }

    constructor(opt?: ConstructorOpts) {
        const {
            printSuccess = false,
            testOnly = [],
            stackDeep = 0,
            autoReport = true,
        } = opt || {};

        this.passed = [];
        this.failed = [];
        this.printSuccess = printSuccess;
        this.num = 0;
        this.testOnly = testOnly;
        this.stackDeep = stackDeep;
        this.timerId = -1;
        this.autoReport = autoReport;
    }

    t(opt: TestOpts): void {
        const {
            result, expect, stackDeep,
            name = "",
            printLink = true,
            autoReport   = this.autoReport,
            printSuccess = this.printSuccess,
        } = opt;
        const {filename, lineNum = 0, column = 0} = getLineNum(2 + (stackDeep ?? this.stackDeep));

        this.num++;
        if (this.testOnly.length && !this.testOnly.includes(this.num)) {
            return;
        }

        const pad1 = " ".repeat(Math.max(0, 2 - this.num.toString().length));
        const pad2 = " ".repeat(Math.max(0, 3 - lineNum.toString().length));

        if (expect === undefined) {
            console.log(ANSI_BLUE(this.num), pad1, ANSI_GRAY(lineNum), pad2, result, name);
        } else {
            const eq = result === expect;
            if (eq) {
                console.log(ANSI_GREEN_BOLD(this.num), pad1, ANSI_GRAY(lineNum), pad2, ANSI_GREEN_BOLD("passed"), name);
                printSuccess && console.log(ANSI_GRAY("result: "), ANSI_BLUE(result));
                printSuccess && console.log(ANSI_GRAY("---"));
                this.passed.push(this.num);
            } else {
                console.log(ANSI_RED_BOLD(this.num), pad1, ANSI_GRAY(lineNum), pad2, ANSI_RED_BOLD("failed"), name);
                console.log(ANSI_GRAY("expect: "), ANSI_BLUE(expect));
                console.log(ANSI_GRAY("result: "), ANSI_RED_BOLD(result));
                printLink && console.log(`file:///./${filename}:${lineNum}:${column}`); // Expects work dir === file location
                this.failed.push(this.num);
                console.log(ANSI_GRAY("---"));
            }
        }
        autoReport && this.delayReport();
    }
    private delayReport(): void {
        clearTimeout(this.timerId)
        this.timerId = setTimeout(() => this.report(), 50);
    }
    report(): void {
        console.log(ANSI_GRAY("---------------"));
        const COLOR_PASS = this.passed.length ? ANSI_GREEN_BOLD : ANSI_GRAY;
        const COLOR_FAIL = this.failed.length ? ANSI_RED_BOLD   : ANSI_GRAY;
        console.log(COLOR_PASS(this.passed.length.toString().padStart(8) + " passed"));
        console.log(COLOR_FAIL(this.failed.length.toString().padStart(8) + " failed"));
        console.log(ANSI_GRAY("---------------\n"));
    }
}

export type LineNumType = {
    filename?: string
    lineNum?:  string
    column?:   string
};

/**
 * @param {number} [stackDeep = 2]
 * @return {LineNumType}
 */
function getLineNum(stackDeep: number = 2): LineNumType {
    const errorLines = new Error().stack!.split("\n");
    if (errorLines[0] === "Error") {
        errorLines.shift();
    }
    const fileLine = errorLines[stackDeep]?.split(/[\\\/]/).pop();
    const {filename, line, column} = fileLine?.match(/(?<filename>.+):(?<line>\d+):(?<column>\d+)/)?.groups || {};
    return {filename, lineNum: line, column};
}
