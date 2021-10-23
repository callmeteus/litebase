const { open, Table } = require("../out");

const assert = require("assert");

/**
 * @type {import("../types/model/Storage").LiteBaseStorage}
 */
let storage;

/**
 * @type {import("../types/model/Table").LiteBaseTable}
 */
let table;

describe("Default test", () => {
    describe("Storage definition", () => {
        it("should create the table and initialize the storage", () => {
            storage = open(__dirname + "/test.ldb", {
                dropSchema: true
            });
            
            // Create a table first
            table = new Table("table", {
                index: {
                    type: "index",
                    autoIncrement: true,
                    primary: true
                },
                name: {
                    type: "string"
                },
                isAlive: {
                    type: "boolean",
                    default: true
                }
            }, storage);

            // Initialize the storage to emit the table creation
            return storage.init();
        });
    });

    describe("Queries", () => {
        it("should insert two rows into the table", () => {
            // Insert some data into the table
            assert.strictEqual(
                table.insert(
                    [
                        {
                            index: 1,
                            name: "Matheus"
                        },
                        {
                            index: 2,
                            name: "Arzio",
                            isAlive: false
                        }
                    ]
                ).length,
                2, "Should return two inserted rows"
            );
        });

        it("findOne({ name: Matheus }) should return one row with name Matheus", () => {
            assert.strictEqual(table.findOne({ name: "Matheus" }).name, "Matheus", "No row with name Matheus was found");
        });

        it("findOne({ name: Unknown }) should return zero rows", () => {
            assert.strictEqual(table.findOne({ name: "Unknown" }), null, "An invalid row was returned for a query that shold return 0 rows")
        });

        it("find() should return two rows", () => {
            assert.strictEqual(table.find().length, 2, "A number different than 2 rows was returned");
        });

        it("findOne(2) should return one row with name Arzio", () => {
            assert.strictEqual(table.findOne(2).name, "Arzio", "A name different than Arzio was returned");
        });

        it("should update isAlive to true", () => {
            assert.strictEqual(
                table.update({
                    isAlive: true
                }, {
                    name: "Arzio"
                }).length,
                1, "No update or more than one updates were executed"
            );

            const arzio = table.findOne(2);

            assert.strictEqual(arzio.isAlive, true, "Arzio is still not alive");
        });
    });

    describe("Table schema restructure", () => {
        it("should remove the isAlive field", () => {
            assert.strictEqual(
                table.setSchema({
                    index: {
                        type: "index",
                        primary: true
                    },
                    name: {
                        type: "string"
                    }
                }),
                true, "Failed to restructure the table schema"
            );
        });

        it("should return one row with name Matheus without the isAlive field", () => {
            const result = table.findOne(1);
            
            assert.strictEqual(result.name, "Matheus", "Returned name is not Matheus");
            assert.strictEqual(result.isAlive, undefined, "Returned a value for isAlive instead of undefined");
        });
    });

    // At this point, we still have 2 rows in the table

    describe("Blind indexes", () => {
        it("should add a new row with name Johnny at index 3 without specifiying it", () => {
            // Insert some data into the table
            assert.strictEqual(
                table.insert(
                    [
                        {
                            name: "Johnny"
                        }
                    ]
                ).length,
                1, "Should return one inserted rows"
            );

            assert.strictEqual(table.findOne(3).name, "Johnny", "The name should return Johnny");
        });
    });
});