import {Semaphore} from "@alttiri/util-js";

export class AsyncBufferQueue<T> {
    private tasks: T[];
    private done: boolean;
    private promise: Promise<void>;
    private resolve!: (value?: any) => void;
    private semaphore: Semaphore;
    constructor(size = 128) {
        this.tasks = [];
        this.done = false;
        this.promise = new Promise(resolve => {
            this.resolve = resolve;
        });
        this.semaphore = new Semaphore(size);
    }
    close(): void {
        this.done = true;
        this.resolve();
    }
    async enqueue(task: T): Promise<void> {
        await this.semaphore.acquire();
        this.tasks.push(task);
        this.resolve();
        this.promise = new Promise(resolve => {
            this.resolve = resolve;
        });
    }
    async *[Symbol.asyncIterator](): AsyncGenerator<T> {
        while (true) {
            await this.promise;
            if (this.done && !this.tasks.length) {
                break;
            }
            yield this.tasks.shift()!;
            this.semaphore.release();
        }
    }
}

