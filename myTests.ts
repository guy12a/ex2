import { parseL32, unparseL32 } from './src/L32/L32-ast';
import { parseL3, unparseL3 } from './src/L3/L3-ast';
import { Dict2App,L32toL3 } from "./src/q24";

const input1 = `(L32 ((dict (x 1) (y 2)) 'x))`;
const expected1 = `(L3 ((dict '((x . 1) (y . 2))) 'x))`;

const parsed1 = parseL32(input1);
if (parsed1.tag === "Ok") {
    const transformed1 = Dict2App(parsed1.value);
    const result1 = unparseL3(transformed1);
    console.log(result1 === expected1 ? "✅ Test 1 passed" : `❌ Test 1 failed: ${result1}`);
}

const input2 = `(L32 ((dict (a "hello") (b #f)) 'b))`;
const expected2 = `(L3 ((dict '((a . "hello") (b . #f))) 'b))`;

const parsed2 = parseL32(input2);
if (parsed2.tag === "Ok") {
    const transformed2 = Dict2App(parsed2.value);
    const result2 = unparseL3(transformed2);
    console.log(result2 === expected2 ? "✅ Test 2 passed" : `❌ Test 2 failed: ${result2}`);
}


const input3 = `(L32 ((dict (a 'red) (b 1)) 'a))`;
const expected3 = `(L3 ((dict '((a . red) (b . 1))) 'a))`;

const parsed3 = parseL32(input3);
if (parsed3.tag === "Ok") {
    const transformed3 = Dict2App(parsed3.value);
    const result3 = unparseL3(transformed3);
    console.log(result3 === expected3 ? "✅ Test 3 passed" : `❌ Test 3 failed: ${result3}`);
}


const input4 = `(L32 ((dict (a '()) (b 2)) 'a))`;
const expected4 = `(L3 ((dict '((a . ()) (b . 2))) 'a))`;

const parsed4 = parseL32(input4);
if (parsed4.tag === "Ok") {
    const transformed4 = Dict2App(parsed4.value);
    const result4 = unparseL3(transformed4);
    console.log(result4 === expected4 ? "✅ Test 4 passed" : `❌ Test 4 failed: ${result4}`);
}


const input5 = `(L32 ((dict (a (+ 1 2)) (b 3)) 'a))`;
const expected5 = `(L3 ((dict '((a . (+ 1 2)) (b . 3))) 'a))`;

const parsed5 = parseL32(input5);
if (parsed5.tag === "Ok") {
    const transformed5 = Dict2App(parsed5.value);
    const result5 = unparseL3(transformed5);
    console.log(result5 === expected5 ? "✅ Test 5 passed" : `❌ Test 5 failed: ${result5}`);
}


const input6 = `(L32 ((dict (a (+ 1 2)) (b 3)) 'a))`;
const expected6 = `(L3 ((dict '((a . (+ 1 2)) (b . 3))) 'a))`;

const parsed6 = parseL32(input5);
if (parsed6.tag === "Ok") {
    const transformed6 = L32toL3(parsed6.value);
    const result6 = unparseL3(transformed6);
    console.log(result6 === expected6 ? "✅ Test 6 passed" : `❌ Test 6 failed: ${result6}`);
}

