import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import msgpack from "msgpack-lite";
import zlib from "zlib";

import { LiteBaseTable } from "./Table";
import { InternalLiteBaseSchema, PossibleFieldValues } from "../types/Table";

export interface TableFileDescriptor {
    /**
     * The table checksum
     */
    checksum: number,

    /**
     * The last created field ID
     * This number increases every time a new field is added to the table
     * with a new key or index
     */
    lastFieldId: number,

    /**
     * The table schema
     */
    schema: InternalLiteBaseSchema
}

/**
 * Supported compression methods
 */
export enum LiteBaseCompressionType {
    NONE,
    ZLIB
}

export interface LiteBaseOptions {
    /**
     * If can compress the database file
     * If true, Zlib wil be used
     */
    compress: boolean | LiteBaseCompressionType,

    /**
     * If needs to drop the schema (delete the database file)
     */
    dropSchema: boolean
}

export class LiteBaseStorage {
    /**
     * The cache for the storage file
     */
    public cache: {
        tables: {
            [tableName: string]: TableFileDescriptor
        },
        data: {
            [tableName: string]: {
                [rowIndex: number]: {
                    [fieldUuid: number]: PossibleFieldValues
                }
            }
        }
    } = null;

    /**
     * An array of registered tables
     */
    private tables: LiteBaseTable[] = [];

    /**
     * Creates a new LiteBase storage
     */
    constructor(
        protected filename: string,
        protected options?: LiteBaseOptions
    ) {
        if (options.dropSchema && existsSync(filename)) {
            unlinkSync(filename);
        }

        // Check if the file exists
        if (options.dropSchema || !existsSync(filename)) {
            // Create it
            this.save();
        }

        this.load();
    }

    /**
     * Sets a table data
     * @param table The table to be set
     */
    public createTable(table: LiteBaseTable) {
        if (!this.tables.includes(table)) {
            this.tables.push(table);
        }

        return true;
    }

    /**
     * Drops a table
     * @param table The table to be dropped
     */
    public dropTable(table: LiteBaseTable) {
        delete this.cache.tables[table.getName()];
        return this.save();
    }

    /**
     * Loasd the storage database file
     */
    public load() {
        // Read it from the dist
        let file = readFileSync(this.filename);

        // Decompress it if needed
        if (this.options.compress === true || this.options.compress !== LiteBaseCompressionType.NONE) {
            if (this.options.compress == LiteBaseCompressionType.ZLIB) {
                file = zlib.inflateSync(file);
            }
        }

        // Parse it with msgpack
        this.cache = msgpack.decode(file);

        // Load all tables
        this.tables.forEach((table) => table.load());
    }

    /**
     * Checks if the storage is loaded
     * @returns 
     */
    public isLoaded() {
        return this.cache !== null;
    }

    /**
     * Saves the database
     * @returns 
     */
    public save() {
        // First, create the cached file if not created yet
        this.cache = this.cache || {
            // Empty tables
            tables: {},

            // Empty data
            data: {}
        };

        // Encode as msgpack
        let data = msgpack.encode(this.cache);
        
        // Compress if needed
        if (this.options.compress) {
            data = zlib.deflateSync(data);
        }

        return writeFileSync(this.filename, data);
    }

    /**
     * Initializes the storage
     */
    public init() {
        // Save all tables
        this.tables.forEach((table) => table.save());

        this.save();
    }
}