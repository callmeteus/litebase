import { LiteBaseOptions, LiteBaseStorage } from "./model/Storage";
import { LiteBaseTable } from "./model/Table";
export declare function open(filename: string, options: LiteBaseOptions): LiteBaseStorage;
export { LiteBaseTable as Table };
export { LiteBaseStorage as Storage };
