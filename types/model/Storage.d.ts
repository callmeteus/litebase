import { LiteBaseTable } from "./Table";
import { InternalLiteBaseSchema, SingleSerializedlRowValue } from "../types/Table";
/**
 * The descriptor for a table file
 * @internal
 */
export interface TableFileDescriptor {
    /**
     * The table checksum
     */
    checksum: number;
    /**
     * The last created field ID
     * This number increases every time a new field is added to the table
     * with a new key or index
     */
    lastFieldId: number;
    /**
     * The table schema
     */
    schema: InternalLiteBaseSchema;
}
/**
 * Supported compression methods
 */
export declare enum LiteBaseCompressionType {
    NONE = 0,
    ZLIB = 1
}
/**
 * All options to be passed to LiteBase
 */
export interface LiteBaseOptions {
    /**
     * If can compress the database file
     * If true, Zlib wil be used
     */
    compress: boolean | LiteBaseCompressionType;
    /**
     * If needs to drop the schema (delete the database file)
     */
    dropSchema: boolean;
}
export declare class LiteBaseStorage {
    /**
     * The storage filename
     */
    protected filename: string;
    /**
     * The storage options
     */
    protected options?: LiteBaseOptions;
    /**
     * The cache for the storage file
     * @internal
     */
    cache: {
        tables: {
            [tableName: string]: TableFileDescriptor;
        };
        data: {
            [tableName: string]: {
                [rowIndex: number]: SingleSerializedlRowValue;
            };
        };
    };
    /**
     * An array of registered tables
     * @internal
     */
    private tables;
    /**
     * Creates a new LiteBase storage
     */
    constructor(
    /**
     * The storage filename
     */
    filename: string, 
    /**
     * The storage options
     */
    options?: LiteBaseOptions);
    /**
     * Sets a table data
     * @param table The table to be set
     */
    createTable(table: LiteBaseTable): boolean;
    /**
     * Drops a table
     * @param table The table to be dropped
     */
    dropTable(table: LiteBaseTable): void;
    /**
     * Loasd the storage database file
     */
    load(): void;
    /**
     * Checks if the storage is loaded
     * @returns
     */
    isLoaded(): boolean;
    /**
     * Saves the database
     * @returns
     */
    save(): void;
    /**
     * Initializes the storage
     */
    init(): void;
}
