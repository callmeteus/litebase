# litebase
LiteBase is a single-file storage-based database engine written in TypeScript based in MessagePack.

This is a BETA project, it can change drastically over time, so use it with caution for now and stay updated! :D

# How to use
You can integrate LiteBase to your application by installing it from NPM, or using Yarn:
```
npm install litebase
```
```
yarn add litebase
```

---

Then, you can integrate using the API:
```javascript
const { open, Table } = require("litebase");

const storage = open(__dirname + "/test.ldb", {
    dropSchema: true
});

// Create a table first
const table = new Table("table", {
    index: {
        type: "index",
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
storage.init();

table.insert({
    name: "Matheus Giovani",
    isAlive: true
});

console.log(
    table.findOne({
        name: "Matheus Giovani"
    }).name
);

```