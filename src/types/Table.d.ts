/**
 * Possible value types for any table field
 */
export type PossibleFieldValues = string | number | bigint | boolean;

export interface LiteBaseTableField {
    /**
     * The field type
     */
    type: "index" | "string" | "int" | "float" | "bigint" | "binary" | "enum" | "boolean",

    /**
     * If the field can be auto-incremented
     */
    autoIncrement?: boolean,

    /**
     * If the field is a primary key
     */
    primary?: boolean,

    /**
     * If the field value can be null
     */
    null?: boolean,

    /**
     * The default value for the field
     */
    default?: PossibleFieldValues
}

export interface InternalLiteBaseTableField extends LiteBaseTableField {
    /**
     * The field unique ID
     */
    __uuid?: number,

    /**
     * The field last auto increment number
     */
    __autoIncrement?: number
}

/**
 * The litebase field identifier where
 * the key is the field name
 */
export type LiteBaseSchema = { [fieldName: string]: LiteBaseTableField };

/**
 * The internal litebase field identifier where
 * the key is the field name
 */
export type InternalLiteBaseSchema = { [fieldName: string]: InternalLiteBaseTableField };

/**
 * A single row value where
 * the key is the field name and
 * the value is any possible field value
 */
export type SingleRowValue = { [field: string]: PossibleFieldValues };

/**
 * A single row value where
 * the key is the field unique ID and
 * the value is any possible field value
 */
export type SingleSerializedlRowValue = { [fieldUuid: number]: PossibleFieldValues };