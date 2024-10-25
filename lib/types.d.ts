export interface RinoreOptions {
    language?: string;
    prompt?: string;
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
    terminal?: boolean;
    historyFile?: string;
}
