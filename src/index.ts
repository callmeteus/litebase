import { LiteBaseOptions, LiteBaseStorage } from "./model/Storage";
import { LiteBaseTable } from "./model/Table";

export function open(filename: string, options: LiteBaseOptions) {
    return new LiteBaseStorage(filename, options);
}

export { LiteBaseTable as Table };