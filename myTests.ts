import { parseL32 } from './src/L32/L32-ast';
import { unparseL3 } from './src/L3/L3-ast';
import { Dict2App } from "./src/q24";


const input1 = `(dict [x 1] [y 2])`;
const expected1 = `(dict '((x . 1) (y . 2)))`;

const parsed1 = parseL32(input1);
if (parsed1.tag === "Ok") {
    const transformed1 = Dict2App(parsed1.value);
    const result1 = unparseL3(transformed1);
    console.log(result1 === expected1 ? "✅ Test 1 passed" : `❌ Test 1 failed: ${result1}`);
}
