declare module "crc32" {
    export declare function str(string: string): number;
    export declare function bstr(string: string): number;
    export declare function buf(buffer: number[]): number;
}