import napi from "ffi-napi";

const lib = new napi.Library("test.dll", {
    test: ["string", ["string", "number"]]
});

lib.test("teste", 1);