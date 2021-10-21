import { LiteBaseTable, PossibleFieldValues, InternalLiteBaseSchema } from "./Table";
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
export interface LiteBaseOptions {
    /**
     * If can compress the database file
     */
    compress: boolean;
    /**
     * If needs to drop the schema (delete the database file)
     */
    dropSchema: boolean;
}
export declare class LiteBaseStorage {
    protected filename: string;
    protected options?: LiteBaseOptions;
    /**
     * The cache for the storage file
     */
    cache: {
        tables: {
            [tableName: string]: TableFileDescriptor;
        };
        data: {
            [tableName: string]: {
                [rowIndex: number]: {
                    [fieldUuid: number]: PossibleFieldValues;
                };
            };
        };
    };
    /**
     * An array of registered tables
     */
    private tables;
    /**
     * Creates a new LiteBase storage
     */
    constructor(filename: string, options?: LiteBaseOptions);
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
