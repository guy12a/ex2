import { is, reduce } from "ramda";
import { PrimOp } from "./L31-ast";
import { isCompoundSExp, isEmptySExp, isSymbolSExp, makeCompoundSExp, makeEmptySExp, CompoundSExp, EmptySExp, Value, SExpValue, SymbolSExp } from "./L31-value";
import { List, allT, first, isNonEmptyList, rest } from '../shared/list';
import { isBoolean, isNumber, isString } from "../shared/type-predicates";
import { Result, makeOk, makeFailure, isOk } from "../shared/result";
import { format } from "../shared/format";
import { isTrueValue } from "./L31-eval";

export const applyPrimitive = (proc: PrimOp, args: Value[]): Result<Value> =>
    proc.op === "+" ? (allT(isNumber, args) ? makeOk(reduce((x, y) => x + y, 0, args)) : 
                                              makeFailure(`+ expects numbers only: ${format(args)}`)) :
    proc.op === "-" ? minusPrim(args) :
    proc.op === "*" ? (allT(isNumber, args) ? makeOk(reduce((x, y) => x * y, 1, args)) : 
                                              makeFailure(`* expects numbers only: ${format(args)}`)) :
    proc.op === "/" ? divPrim(args) :
    proc.op === ">" ? makeOk(args[0] > args[1]) :
    proc.op === "<" ? makeOk(args[0] < args[1]) :
    proc.op === "=" ? makeOk(args[0] === args[1]) :
    proc.op === "not" ? makeOk(!args[0]) :
    proc.op === "and" ? isBoolean(args[0]) && isBoolean(args[1]) ? makeOk(args[0] && args[1]) : 
                                                                   makeFailure(`Arguments to "and" not booleans: ${format(args)}`) :
    proc.op === "or" ? isBoolean(args[0]) && isBoolean(args[1]) ? makeOk(args[0] || args[1]) : 
                                                                  makeFailure(`Arguments to "or" not booleans: ${format(args)}`) :
    proc.op === "eq?" ? makeOk(eqPrim(args)) :
    proc.op === "string=?" ? makeOk(args[0] === args[1]) :
    proc.op === "cons" ? makeOk(consPrim(args[0], args[1])) :
    proc.op === "car" ? carPrim(args[0]) :
    proc.op === "cdr" ? cdrPrim(args[0]) :
    proc.op === "list" ? makeOk(listPrim(args)) :
    proc.op === "pair?" ? makeOk(isPairPrim(args[0])) :
    proc.op === "number?" ? makeOk(typeof (args[0]) === 'number') :
    proc.op === "boolean?" ? makeOk(typeof (args[0]) === 'boolean') :
    proc.op === "symbol?" ? makeOk(isSymbolSExp(args[0])) :
    proc.op === "string?" ? makeOk(isString(args[0])) :
    proc.op === "dict" ? dictPrim(args[0]) :
    proc.op === "get" ? getPrim(args) :
    proc.op === "dict?" ? makeOk(isDictPrim(args[0])) :
    makeFailure(`Bad primitive op: ${format(proc.op)}`);

const dictPrim = (args: Value): Result<Value> => 
    isDictPrim(args) ? makeOk(args) :
    makeFailure(`dict: expects a list of valid pairs`);


const getPrim = (args: List<Value>): Result<Value> => {
    if(args.length ==2 && isCompoundSExp(args[0]) && isDictPrim(args[0]) && isSymbolSExp(args[1])){
        return searchDict(args[0], args[1]);
    }
    return makeFailure("No proper symbol, or bad dict");
};

const searchDict = (dict: CompoundSExp, symbol: SymbolSExp): Result<Value> => {
    if (isEmptySExp(dict.val2)) {
        return searchPair(dict.val1, symbol);
    }
    if(isCompoundSExp(dict.val2)) {
        const firstPair = searchPair(dict.val1,symbol);
        if(isOk(firstPair))
            return firstPair;
        else
            return searchDict(dict.val2, symbol);
    }
    return makeFailure("couldnt find symbol");
}

const searchPair = (pair : SExpValue, symbol: SymbolSExp): Result<Value> => 
    (isCompoundSExp(pair) && isSymbolSExp(pair.val1) && pair.val1.val===symbol.val) ? makeOk(pair.val2) : makeFailure("didnt find");



const isDictPrim = (args: Value): boolean => 
    isCompoundSExp(args) ? isProperDict(args, [] ) : false;



const isProperDict = (args: CompoundSExp, seen : string[]): boolean => {
    const currentPair = args.val1;
    if(isCompoundSExp(currentPair) && isSymbolSExp(currentPair.val1) && !seen.includes(currentPair.val1.val)){
        const newSeen = [...seen, currentPair.val1.val];
        if(isCompoundSExp(args.val2)) {
            return isProperDict(args.val2, newSeen);
        }
        return true;
    }
    return false;
}


const minusPrim = (args: Value[]): Result<number> => {
    // TODO complete
    const x = args[0], y = args[1];
    if (isNumber(x) && isNumber(y)) {
        return makeOk(x - y);
    }
    else {
        return makeFailure(`Type error: - expects numbers ${format(args)}`);
    }
};

const divPrim = (args: Value[]): Result<number> => {
    // TODO complete
    const x = args[0], y = args[1];
    if (isNumber(x) && isNumber(y)) {
        return makeOk(x / y);
    }
    else {
        return makeFailure(`Type error: / expects numbers ${format(args)}`);
    }
};

const eqPrim = (args: Value[]): boolean => {
    const x = args[0], y = args[1];
    if (isSymbolSExp(x) && isSymbolSExp(y)) {
        return x.val === y.val;
    }
    else if (isEmptySExp(x) && isEmptySExp(y)) {
        return true;
    }
    else if (isNumber(x) && isNumber(y)) {
        return x === y;
    }
    else if (isString(x) && isString(y)) {
        return x === y;
    }
    else if (isBoolean(x) && isBoolean(y)) {
        return x === y;
    }
    else {
        return false;
    }
};

const carPrim = (v: Value): Result<Value> => 
    isCompoundSExp(v) ? makeOk(v.val1) :
    makeFailure(`Car: param is not compound ${format(v)}`);

const cdrPrim = (v: Value): Result<Value> =>
    isCompoundSExp(v) ? makeOk(v.val2) :
    makeFailure(`Cdr: param is not compound ${format(v)}`);

const consPrim = (v1: Value, v2: Value): CompoundSExp =>
    makeCompoundSExp(v1, v2);

export const listPrim = (vals: List<Value>): EmptySExp | CompoundSExp =>
    isNonEmptyList<Value>(vals) ? makeCompoundSExp(first(vals), listPrim(rest(vals))) :
    makeEmptySExp();

const isPairPrim = (v: Value): boolean =>
    isCompoundSExp(v);
