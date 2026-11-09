const assert = require("assert");
const { formatLines, generateBarChart } = require("./index.js");
assert.strictEqual(generateBarChart(100, 21), "█".repeat(21));
assert.strictEqual(generateBarChart(0, 21), "░".repeat(21));
assert.strictEqual(generateBarChart(50, 4), "██░░");
const out = formatLines([{ name: "TypeScriptLong", percent: 62.34, text: "10 hrs 5 mins" }, ...Array(6).fill({ name: "Go", percent: 1, text: "1 min" })]);
assert.strictEqual(out.length, 5);
assert.ok(out[0].startsWith("TypeScr... 10 hrs 5 mins "));
assert.ok(out[0].endsWith(" 62.3%"));

assert.deepStrictEqual(formatLines([]), []);
console.log("ok");
