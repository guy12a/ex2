//import { CExp as L3CExp, AppExp, Exp, isBoolExp, isNumExp, isStrExp, makeAppExp, makeLitExp, makePrimOp, makeProgram, makeVarRef, Program } from './L3/L3-ast';
//import { CompoundSExp, EmptySExp, makeCompoundSExp, makeEmptySExp, makeSymbolSExp, SExpValue, Value } from './L3/L3-value';
//import { CExp as L32CExp, DictBinding, DictExp, isDictExp, unparseL32 } from './L32/L32-ast';

import * as L3 from './L3/L3-ast';
import * as L32 from './L32/L32-ast';
import * as L3val from './L3/L3-value';
import * as L32val from './L32/L32-value';

import { parseL32 } from './L32/L32-ast';
import { unparseL3 } from './L3/L3-ast';

import { first, isEmpty, isNonEmptyList, List, rest } from './shared/list';
/*
Purpose: rewrite all occurrences of DictExp in a program to AppExp.
Signature: Dict2App (exp)
Type: Program -> Program
*/
export const Dict2App  = (exp: L32.Program) : L3.Program =>
    L3.makeProgram(convertSequence(exp.exps));

const convertSequence = (seq: List<L32.Exp>): List<L3.Exp> =>{
    if(isNonEmptyList<L32.Exp>(seq))
        return [convertSingle(first(seq)), ...convertSequence(rest(seq))];
    return [];
}

const convertSingle = (exp: L32.Exp): L3.Exp => {
    if (L32.isDefineExp(exp)) {
        return L3.makeDefineExp(exp.var, deepReplace(exp.val));
    } else if (L32.isCExp(exp)) {
        return deepReplace(exp);
    } else {
        return L3.makeStrExp("unhandled exp kind");
    }
};

//Changes a L32 dictExpression into a L3 AppExp
const convertDict = (exp: L32.DictExp): L3.AppExp =>
    L3.makeAppExp(L3.makeVarRef("dict"), [L3.makeLitExp(array2LitList(exp.pairs))]);


//Takes an array pairs from the dictionary, and replaces them with a list
const array2LitList = (pairs: L32.DictBinding[]): L3val.CompoundSExp | L3val.EmptySExp => {
    if(pairs.length === 0)
        return L3val.makeEmptySExp();
    else
        return L3val.makeCompoundSExp(L3val.makeCompoundSExp(pairs[0].var, simpleEval(pairs[0].val)),
            array2LitList(pairs.slice(1)));
}

//Helper function to array2LitList
//If the val in a pair is a simple value - we return its value
//For all other values for a pair (closure, dict...) we give back a symbol.
const simpleEval = (exp: L32.CExp): L3val.SExpValue => {
    if (L32.isNumExp(exp) || L32.isBoolExp(exp) || L32.isStrExp(exp)) {
        return exp.val;
    } else {
        const unparsed = L32.unparseL32(exp);
        const sym = unparsed.startsWith("'") ? unparsed.slice(1) : unparsed;
        return L3val.makeSymbolSExp(sym);
    }
}

//Takes a L32 litExpression and converts its value into L3 lit expression
const convertSExp = (val: L32val.SExpValue): L3val.SExpValue => {
    if (L32val.isEmptySExp(val)) {
        return L3val.makeEmptySExp();
    } else if (L32val.isSymbolSExp(val)) {
        return L3val.makeSymbolSExp(val.val);
    } else if (L32val.isCompoundSExp(val)) {
        return L3val.makeCompoundSExp(convertSExp(val.val1), convertSExp(val.val2));
    } else if (L32val.isDictValue(val)) {
        return L3val.makeSymbolSExp("dictValue shouldnt be reached"); // This is how you convert a DictValue (array of bindings)
    } else if (L32val.isClosure(val)){
        return L3val.makeSymbolSExp("closure shouldnt be reached")
    } else {
        return val; // number | boolean | string | PrimOp
    }
};

// const replaceCExp = (first: L32.Exp, rest: L32.Exp[]): List<L3.Exp> =>{
//     if(L32.isCExp(first) && isEmpty(rest))
//         return deepReplace(first);
//     else if(L32.isCExp(first)){
//         deepReplace(first);
//         convertSequence(rest);
//     }

//     return [L3.makeStrExp("error in replace CExp")];
// }

// const replaceDefine = (def: L32.Exp, exps: L32.Exp[]): List<L3.Exp> =>{
//     if(L32.isDefineExp(def)){
//         deepReplace(def.val);
//         convertSequence(exps);
//     }
//     return [L3.makeStrExp("error in replace define")];
// }



//Takes an exp in L32, and converts it to the same CExp in L3
//Recursively goes into the CExps contained in if, proc... and converts them too
const deepReplace = (exp: L32.CExp): L3.CExp => {
    if(L32.isAtomicExp(exp))
        return exp;
    else if(L32.isLitExp(exp))
        return L3.makeLitExp(convertSExp(exp.val));    
    else if (L32.isIfExp(exp)) {
        return L3.makeIfExp(
            deepReplace(exp.test),
            deepReplace(exp.then),
            deepReplace(exp.alt)
        );
    } 
    else if (L32.isProcExp(exp)) {
        return L3.makeProcExp(
            exp.args,
            exp.body.map(deepReplace)
        );
    } 
    else if (L32.isLetExp(exp)) {
        return L3.makeLetExp(
            exp.bindings.map(b => L3.makeBinding(b.var.var, deepReplace(b.val))),
            exp.body.map(deepReplace)
        );
    } 
    else if (L32.isDictExp(exp)){
        return convertDict(exp);  // handles the DictExp -> AppExp conversion
    }
    else if(L32.isAppExp(exp)){
        return L3.makeAppExp(
            deepReplace(exp.rator),
            exp.rands.map(deepReplace)
        );
    }
    return L3.makeStrExp("error");
}

/*
Purpose: Transform L32 program to L3
Signature: L32ToL3(prog)
Type: Program -> Program
*/
export const L32toL3 = (prog : L32.Program): L3.Program =>
    //@TODO
    L3.makeProgram([]);




