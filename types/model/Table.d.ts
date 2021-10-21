import { LiteBaseStorage } from "./Storage";
export declare type PossibleFieldValues = string | number | bigint | boolean;
interface LiteBaseTableField {
    type: "index" | "string" | "int" | "float" | "bigint" | "binary" | "enum" | "boolean";
    autoIncrement?: boolean;
    primary?: boolean;
    null?: boolean;
    default?: PossibleFieldValues;
}
interface InternalLiteBaseTableField extends LiteBaseTableField {
    /**
     * The field unique ID
     */
    __uuid?: number;
    /**
     * The field last auto increment number
     */
    __autoIncrement?: number;
}
/**
 * The litebase field identifier where
 * the key is the field name
 */
export declare type LiteBaseSchema = {
    [fieldName: string]: LiteBaseTableField;
};
/**
 * The internal litebase field identifier where
 * the key is the field name
 */
export declare type InternalLiteBaseSchema = {
    [fieldName: string]: InternalLiteBaseTableField;
};
/**
 * A single row value where
 * the key is the field unique ID and
 * the value is any possible field value
 */
export declare type SingleRowValue = {
    [fieldUuid: number]: PossibleFieldValues;
};
export declare class LiteBaseTable {
    /**
     * The table name
     */
    protected name: string;
    /**
     * The table schema
     */
    protected schema: InternalLiteBaseSchema;
    /**
     * The table storage instance
     */
    private storage?;
    /**
     * The schema checksum
     */
    private checksum;
    /**
     * The current schema checksum
     */
    private currentChecksum;
    /**
     * The last created schema field ID
     */
    private lastFieldId;
    /**
     * If there is any pending schema save, like for auto-increment
     */
    private pendingSchemaSave;
    constructor(
    /**
     * The table name
     */
    name: string, 
    /**
     * The table schema
     */
    schema: InternalLiteBaseSchema, 
    /**
     * The table storage instance
     */
    storage?: LiteBaseStorage);
    /**
     * Checks if the table was cached
     * @returns
     */
    isCached(): boolean;
    /**
     * Initializes the table schema
     */
    load(): boolean;
    /**
     * Sets the table schema
     * @param schema The new table schema
     */
    setSchema(schema: LiteBaseSchema): boolean;
    /**
     * Retrieves the table name
     * @returns
     */
    getName(): string;
    /**
     * Attaches this table to a storage file
     * @param storage The storage instance
     */
    attach(storage: LiteBaseStorage): void;
    /**
     * Retrieves the table schema
     * @returns
     */
    getSchema(): InternalLiteBaseSchema;
    /**
     * Retrieves the cache
     * @returns
     */
    private getCache;
    /**
     * Retrieves the table cache for this table
     * @returns
     */
    getTableCache(): import("./Storage").TableFileDescriptor;
    /**
     * Retrieves the data cache for this table
     * @returns
     */
    getDataCache(): {
        [rowIndex: number]: {
            [fieldUuid: number]: PossibleFieldValues;
        };
    };
    /**
     * Retrieves a field index by name
     * @param field The field name
     * @returns
     */
    private getFieldIndex;
    /**
     * Maps a given array of values to a the table schema
     * @param data The data to be structured
     * @returns
     */
    private mapToStructure;
    /**
     * Executes the given query and returns all found values
     * @param query The query to be executed
     * @returns
     */
    find(query?: Record<string, PossibleFieldValues>): Record<string, PossibleFieldValues>[];
    /**
     * Executes the given query and returns one value
     * @param query The query to be executed
     * @returns
     */
    findOne(query: number | Record<string, PossibleFieldValues>): Record<string, PossibleFieldValues>;
    /**
     * Parses a key-value pair object into a fieldUuid-value pair object
     * @param data The key-value pair to be parsed
     * @returns
     */
    private parseValues;
    /**
     * Checks if this table has a primary-index field
     * @returns
     */
    hasPrimaryIndexField(): boolean;
    /**
     * Retrieves the table primary-index field
     * @returns
     */
    getPrimaryIndexField(): string;
    /**
     * Sets an item to the cache and save it
     * @param index The item index
     * @param item The item value
     * @returns
     */
    private setCacheItem;
    /**
     * Retrieves a unique index for a row
     * @param field The row to be added
     * @returns
     */
    private getUniqueIndexFor;
    /**
     * Inserts data to the table
     * @param data The data to be inserted
     * @throws Error
     * @throws TypeError
     */
    insert(data: Record<string, PossibleFieldValues> | any[]): any[];
    /**
     * Saves the table
     */
    save(): void;
    /**
     * Synchronizes the cached data
     * with the storage
     */
    sync(): void;
}
export {};
