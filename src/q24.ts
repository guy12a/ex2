//import { CExp as L3CExp, AppExp, Exp, isBoolExp, isNumExp, isStrExp, makeAppExp, makeLitExp, makePrimOp, makeProgram, makeVarRef, Program } from './L3/L3-ast';
//import { CompoundSExp, EmptySExp, makeCompoundSExp, makeEmptySExp, makeSymbolSExp, SExpValue, Value } from './L3/L3-value';
//import { CExp as L32CExp, DictBinding, DictExp, isDictExp, unparseL32 } from './L32/L32-ast';

import * as L3 from './L3/L3-ast';
import * as L32 from './L32/L32-ast';
import * as L3val from './L3/L3-value';
import * as L32val from './L32/L32-value';
import { first, isNonEmptyList, rest } from './shared/list';
/*
Purpose: rewrite all occurrences of DictExp in a program to AppExp.
Signature: Dict2App (exp)
Type: Program -> Program
*/
export const Dict2App  = (exp: L32.Program) : L3.Program =>
    //@TODO
    L3.makeProgram([]);


const convertDict = (exp: L32.DictExp): L3.AppExp =>
    L3.makeAppExp(L3.makeVarRef("dict"), [L3.makeLitExp(array2LitList(exp.pairs))]);

const array2LitList = (pairs: L32.DictBinding[]): L3val.CompoundSExp | L3val.EmptySExp => {
    if(pairs.length === 0)
        return L3val.makeEmptySExp();
    else
        return L3val.makeCompoundSExp(L3val.makeCompoundSExp(pairs[0].var, simpleEval(pairs[0].val)),
            array2LitList(pairs.slice(1)));
    
}

const simpleEval = (exp: L32.CExp): L3val.SExpValue => {
    if(L32.isNumExp(exp) || L32.isBoolExp(exp) || L32.isStrExp(exp))
        return exp.val
    else
        return L3val.makeSymbolSExp(L32.unparseL32(exp));  
}

const convertSExp = (val: L32val.SExpValue): L3val.SExpValue => {
    if (L32val.isEmptySExp(val)) {
        return L3val.makeEmptySExp();
    } else if (L32val.isSymbolSExp(val)) {
        return L3val.makeSymbolSExp(val.val);
    } else if (L32val.isCompoundSExp(val)) {
        return L3val.makeCompoundSExp(convertSExp(val.val1), convertSExp(val.val2));
    } else if (L32val.isDictValue(val)) {
        return L3val.makeSymbolSExp(L32.unparseL32()); // This is how you convert a DictValue (array of bindings)
    } else {
        //return val; // number | boolean | string | PrimOp
    }
    return L3val.makeEmptySExp();
};

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
    else if (L32.isDictExp(exp))
        return convertDict(exp);  // handles the DictExp -> AppExp conversion
    return L3.makeStrExp("error");
}

/*
Purpose: Transform L32 program to L3
Signature: L32ToL3(prog)
Type: Program -> Program
*/
export const L32toL3 = (prog : Program): Program =>
    //@TODO
    makeProgram([]);