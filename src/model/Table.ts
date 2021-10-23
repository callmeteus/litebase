import { LiteBaseStorage } from "./Storage";
import crc32 from "crc-32";

// Separate types for better reading
import {
    LiteBaseSchema,
    LiteBaseTableField,
    InternalLiteBaseSchema,
    PossibleFieldValues,
    SingleRowValue,
    SingleSerializedlRowValue,
    SingleQueryValue
} from "../types/Table";

export type Query = SingleQueryValue & {
    [K in keyof typeof QueryKeywords]?: typeof QueryKeywords[K]
};

/**
 * All query keywords / functions / helpers
 */
export const QueryKeywords = {
    /**
     * Used to limit the query results
     */
    LIMIT: Symbol.for("LIMIT")
};

/**
 * Default field values
 */
const DefaultFieldValues: LiteBaseTableField = {
    type: null,
    autoIncrement: false,
    null: true,
    primary: false
};

export class LiteBaseTable {
    /**
     * The schema checksum
     */
    private checksum: number = 1;

    /**
     * The current schema checksum
     */
    private currentChecksum: number = 1;

    /**
     * The last created schema field ID
     */
    private lastFieldId: number = 0;

    /**
     * If there is any pending schema save, like for auto-increment
     */
    private pendingSchemaSave: boolean = true;

    public constructor(
        /**
         * The table name
         */
        protected name: string,

        /**
         * The table schema
         */
        public schema: InternalLiteBaseSchema,

        /**
         * The table storage instance
         */
        private storage?: LiteBaseStorage
    ) {
        // If any schema was given
        if (schema) {
            // Set it
            this.setSchema(schema);
        }

        if (storage) {
            this.save();
        }
    }

    /**
     * Checks if the table was cached
     * @returns 
     */
    public isCached() {
        return this.getTableCache() !== undefined;
    }

    /**
     * Initializes the table schema
     */
    public load() {
        // Load the last field ID
        // If not loaded, will default to zero
        this.lastFieldId = this.getTableCache()?.lastFieldId || 0;

        // Load the cached schema
        const cachedSchema = this.getTableCache()?.schema;

        // Extract the schema keys
        const keys = Object.keys(this.schema);

        // Filter the newly created field keys
        const newFields = !cachedSchema ? keys : keys.filter((key) => cachedSchema[key] === undefined);

        // Filter the removed created field keys
        const removedFields = !cachedSchema ? [] : Object.keys(cachedSchema).filter((key) => this.schema[key] === undefined);

        // Iterate over all schema fields
        for(let key of keys) {
            // Filter out the new ones
            if (newFields.includes(key)) {
                continue;
            }

            // If the schema is cached, and the key exists inside the cached schema
            if (cachedSchema && cachedSchema[key]) {
                // Set the UUID for this field
                this.schema[key].__uuid = cachedSchema[key].__uuid;
                this.lastFieldId = cachedSchema[key].__uuid;

                // If it's an auto-increment field, set it's initial value
                if (cachedSchema[key].autoIncrement) {
                    this.schema[key].__autoIncrement = cachedSchema[key].__autoIncrement || 1;
                }
            }
        }

        // Iterate over the new fields
        for(let key of newFields) {
            // Set a unique ID for it
            this.schema[key].__uuid = this.lastFieldId++;

            // If it's an auto-increment field, set it's initial value
            if (this.schema[key].autoIncrement) {
                this.schema[key].__autoIncrement = 1;
            }
        }

        // If has any removed field
        if (removedFields.length) {
            const dataCache = this.getDataCache();

            // Check if data was loaded
            if (dataCache) {
                // Iterate over the removed field
                for(let key of removedFields) {
                    // Remove it from all data
                    (Object.keys(dataCache) as any as number[])
                        .forEach((row) => {
                            delete dataCache[row][cachedSchema[key].__uuid];
                        });
                }
            }
        }

        // Calculate the CRC for the schema
        this.currentChecksum = crc32.str(JSON.stringify(this.schema));

        return true;
    }

    /**
     * Sets the table schema
     * @param schema The new table schema
     */
    public setSchema(schema: LiteBaseSchema) {
        // Reset the current schema
        this.schema = {};

        // Setup the schema
        for(let key of Object.keys(schema)) {
            const struct = schema[key];

            // If it's an index field
            if (struct.type === "index") {
                // It will obligatory be an auto-increment field
                struct.autoIncrement = true;
            }

            this.schema[key] = Object.assign({}, DefaultFieldValues, struct);

            // If it's an auto-increment field, set it's initial value
            if (struct.autoIncrement) {
                this.schema[key].__autoIncrement = 1;
            }
        }

        return this.load();
    }

    /**
     * Retrieves the table name
     * @returns 
     */
    public getName() {
        return this.name;
    }

    /**
     * Attaches this table to a storage file
     * @param storage The storage instance
     */
    public attach(storage: LiteBaseStorage) {
        this.storage = storage;
    }

    /**
     * Retrieves the table schema
     * @returns 
     */
    public getSchema() {
        return this.schema;
    }

    /**
     * Retrieves the cache
     * @returns 
     */
    private getCache() {
        return this.storage.cache;
    }

    /**
     * Retrieves the table cache for this table
     * @returns 
     */
    public getTableCache() {
        return this.storage.cache.tables[this.getName()];
    }

    /**
     * Retrieves the data cache for this table
     * @returns 
     */
    public getDataCache() {
        return this.storage.cache.data[this.getName()];
    }

    /**
     * Retrieves a field index by name
     * @param field The field name
     * @returns 
     */
    private getFieldIndex(field: string | symbol) {
        return this.schema[field].__uuid;
    }
    
    /**
     * Maps a given array of values to a the table schema
     * @param data The data to be structured
     * @returns 
     */
    private mapToStructure(data: SingleSerializedlRowValue) {
        if (data === null || data === undefined) {
            return null;
        }

        const final: SingleRowValue = {};

        Object.keys(this.schema).forEach((key, index) => {
            final[key] = data[this.schema[key].__uuid];
        });

        return final;
    }

    /**
     * Checks if this table has a primary-index field
     * @returns 
     */
    public hasPrimaryIndexField() {
        return this.getPrimaryIndexField() !== undefined;
    }

    /**
     * Retrieves the table primary-index field
     * @returns 
     */
    public getPrimaryIndexField() {
        return Object.keys(this.schema).find((field) => 
            this.schema[field].type === "index" &&
            this.schema[field].primary &&
            this.schema[field].autoIncrement
        );
    }

    /**
     * Sets an item to the cache and save it
     * @param index The item index
     * @param item The item value
     * @returns 
     */
    private setCacheItem(index: number, item: SingleRowValue) {
        this.storage.cache.data[this.name][index] = item;
        return this.save();
    }

    /**
     * Parses a key-value pair object into a fieldUuid-value pair object
     * @param data The key-value pair to be parsed
     * @returns 
     */
    private parseValues(data: SingleRowValue) {
        const final: { [index: number]: PossibleFieldValues } = {};      

        // Iterate over the schema
        Object.keys(this.schema).forEach((key) => {
            const field = this.schema[key];

            // Check if has no value for this key
            if (data[key] === undefined) {
                // Check if has a default value
                if (field.default) {
                    data[key] = field.default;
                } else
                // Check if it's a required field
                if (!field.null && !field.autoIncrement) {
                    throw new Error("Field \"" + key + "\" can't be null.");
                }
            }

            let value: any = data[key];

            switch(field.type) {
                case "index":
                    // First check for NaN
                    if (value !== undefined && isNaN(value)) {
                        throw new TypeError("A non-numeric value encountered for field \"" + key + "\"");
                    }

                    // If it's an auto-increment field
                    if (field.autoIncrement) {
                        // Increment it
                        value = field.__autoIncrement++;
                        this.pendingSchemaSave = true;
                    } else {
                        throw new Error("Litebase doesn't known what value to index for field \"" + key + "\"");
                    }
                break;

                case "int":
                case "float":
                case "bigint":
                    // First check for NaN
                    if (isNaN(value)) {
                        throw new TypeError("A non-numeric value encountered for field \"" + key + "\"");
                    }

                case "int":
                    value = parseInt(value, 10);
                break;

                case "float":
                    value = parseFloat(value);
                break;

                case "bigint":
                    value = BigInt(value);
                break;

                case "binary":
                    if (value instanceof Buffer) {
                        value = value.toJSON().data;
                    } else
                    if (Array.isArray(value)) {
                        value = value.map((v) => parseInt(v, 10));
                    }
                break;

                case "boolean":
                    // Convert strings to booleans
                    if (typeof value === "string") {
                        value = value === "1" || value.toLowerCase() === "true";
                    } else
                    // Convert numbers to true or false (0 = false, 1 = true)
                    if (typeof value === "number") {
                        value = value === 1;
                    } else
                    // Convert undefined and null to false
                    if (value === undefined || value === null) {
                        value = false
                    } else
                    // If it's not a boolean, it should fail
                    if (typeof value !== "boolean") {
                        throw new TypeError("Invalid value type for field \"" + key + "\"");
                    }
                break;
            }

            // Set it
            final[field.__uuid] = value;
        });

        return final;
    }

    /**
     * Retrieves a unique index for a row
     * @param field The row to be added
     * @returns 
     */
    private getUniqueIndexFor(row: SingleSerializedlRowValue) {
        let primaryIndexField = this.getPrimaryIndexField();

        // Check if this table has an index row
        if (primaryIndexField) {
            let possibleIndex = row[this.schema[primaryIndexField].__uuid] as number;

            // Check if any value was given for this field
            if (possibleIndex) {
                // This should at a point overwrite data
                // but... yeap, not my problem
                return possibleIndex;
            }

            this.pendingSchemaSave = true;

            return this.schema[primaryIndexField].__autoIncrement++;
        }

        const values = Object.values(this.getDataCache());

        return values.indexOf(values.pop());
    }

    /**
     * Mounts and executes a query
     * @param query The query to be executed
     * @returns 
     */
    private query(query?: Query) {
        // Retrieve all values
        const values = Object.values(this.getDataCache());

        // If no query was given, return all rows
        if (query === undefined || query === null) {
            return values.map((v) => this.mapToStructure(v));
        }

        // The variable that will receive the mounted query
        // with the field index instead of the field name
        const finalQuery: Record<number, PossibleFieldValues> = {};
        const keys: (string | symbol)[] = Object.keys(query);

        let validKeys: number = 0;

        // Prepare the index-value pairs
        for(let key of keys) {
            // Ignore query keywords
            if (QueryKeywords[key as keyof typeof QueryKeywords] !== undefined) {
                continue;
            }

            finalQuery[this.getFieldIndex(key)] = query[key];
            validKeys++;
        }

        const result: SingleRowValue[] = [];
        let i: number;
        let k: any;

        let limit = query[QueryKeywords.LIMIT] ? query[QueryKeywords.LIMIT] as number: Number.MAX_SAFE_INTEGER;

        // Iterate over all database values
        search:
        for(i = 0; i < values.length; i++) {
            // Iterate over all query fields
            for(k in finalQuery) {
                // If the query value doesn't match the row value, ignore it
                if (finalQuery[k] != values[i][k]) {
                    continue search;
                }
            }

            result.push(
                this.mapToStructure(
                    values[i]
                )
            );

            // Check if reached the limit
            if (result.length >= limit) {
                break;
            }
        }

        return result;
    }

    /**
     * Executes the given query and returns all found values
     * @param query The query to be executed
     * @returns 
     */
    public find(query?: Query): SingleRowValue[] | null {
        return this.query(query);
    }

    /**
     * Executes the given query and returns one value
     * @param query The query to be executed
     * @returns 
     */
    public findOne(query: number | Query): SingleRowValue | null {
        if (typeof query === "number") {
            return this.mapToStructure(
                this.getDataCache()[query as number]
            );
        }

        return this.query(
            Object.assign({}, query, {
                // Limit to one result
                [QueryKeywords.LIMIT]: 1
            })
        )[0] || null;
    }

    /**
     * Inserts data to the table
     * @param data The data to be inserted
     * @throws Error
     * @throws TypeError
     */
    public insert(data: SingleRowValue | any[]): any[] {
        if (typeof data === "undefined") {
            throw new Error("No data was given");
        }

        if (Array.isArray(data)) {
            // Process all rows
            return data.map((v) => this.insert(v));
        }

        const final = this.parseValues(data);
        const index = this.getUniqueIndexFor(final);

        // Save it to the storage
        this.setCacheItem(index, final);

        return Object.values(final);
    }

    /**
     * Performs an update in the table
     * @param data The data to be updated
     * @param where The query to be searched to update
     * @returns All changed rows
     */
    public update(data: {
        [K in keyof this["schema"]]: this["schema"][K]["type"]
    }, where?: Query) {
        // Retrieve all keys for the where
        const keys = where === undefined ? Object.keys(this.schema) : Object.keys(where);
        const values = Object.values(this.getDataCache());

        let found = where === undefined ? values : values.filter((value) => {
            return keys.every((key) => value[this.getFieldIndex(key)] === where[key]);
        });

        for(let item of found) {
            for(let key of Object.keys(data)) {
                item[this.getFieldIndex(key)] = data[key];
            }
        }

        this.save();

        return found;
    }

    /**
     * Saves the table
     */
    public save() {
        // Create the table if not created yet
        this.storage.createTable(this);

        // Synchronize the table data
        this.sync();

        // Set the handler for the data if none was set
        this.getCache().data[this.name] = this.getCache().data[this.name] || {};

        return this.storage.save();
    }

    /**
     * Synchronizes the cached data
     * with the storage
     */
    public sync() {
        if (this.pendingSchemaSave) {
            // Update the schema
            this.getCache().tables[this.name] = {
                lastFieldId: this.lastFieldId,
                checksum: this.currentChecksum,
                schema: this.getSchema()
            };
        }

        this.pendingSchemaSave = false;
    }
};