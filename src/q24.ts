//import { CExp as L3CExp, AppExp, Exp, isBoolExp, isNumExp, isStrExp, makeAppExp, makeLitExp, makePrimOp, makeProgram, makeVarRef, Program } from './L3/L3-ast';
//import { CompoundSExp, EmptySExp, makeCompoundSExp, makeEmptySExp, makeSymbolSExp, SExpValue, Value } from './L3/L3-value';
//import { CExp as L32CExp, DictBinding, DictExp, isDictExp, unparseL32 } from './L32/L32-ast';

import * as L3 from './L3/L3-ast';
import * as L32 from './L32/L32-ast';
import * as L3val from './L3/L3-value';
import * as L32val from './L32/L32-value';

import { first, isEmpty, isNonEmptyList, List, rest } from './shared/list';
import { isOk } from './shared/result';
/*
Purpose: rewrite all occurrences of DictExp in a program to AppExp.
Signature: Dict2App (exp)
Type: Program -> Program
*/
export const Dict2App  = (exp: L32.Program) : L3.Program =>
    L3.makeProgram(convertSequence(exp.exps));

//Gets a list of L32 exps, and converts each one, in order, into L3 using convertSingle
const convertSequence = (seq: List<L32.Exp>): List<L3.Exp> =>{
    if(isNonEmptyList<L32.Exp>(seq))
        return [convertSingle(first(seq)), ...convertSequence(rest(seq))];
    return [];
}

//Gets a single L32 expression
//   if its define, replaces its value (cexp)
//   if its CExp, replaces it directly
//Both are using deepReplace to do it
const convertSingle = (exp: L32.Exp): L3.Exp => {
    if (L32.isDefineExp(exp)) {
        return L3.makeDefineExp(exp.var, deepReplace(exp.val));
    } else if (L32.isCExp(exp)) {
        return deepReplace(exp);
    } else {
        return L3.makeStrExp("unhandled exp kind");
    }
};

//Takes a L32 cexp and replaces it with L3 cexp
//If its atomic - returns it as it is
//If its a special form like proc,if,let or app - converts them "deeply"
//      for example: in If it will also look into the test, then, and alt, and replace whatever is in there
//If its lit expression: handled differently by convert SExp
//If its dictExp: handled by convertDict
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

//====================================
//Converting a L32 dict into L3 app

//Changes a L32 dictExpression into a L3 AppExp
//By replacing its list of pairs with a L3 type list: (dict (a 2) (b 3)) => (dict '((a 2) (b 3)))
//Replacing the list is done with array2LitList
const convertDict = (exp: L32.DictExp): L3.AppExp =>
    L3.makeAppExp(L3.makeVarRef("dict"), [L3.makeLitExp(pairs2LitList(exp.pairs))]);


//Takes an pairs array from the dictionary, and replaces them with a list
const pairs2LitList = (pairs: L32.DictBinding[]): L3val.CompoundSExp | L3val.EmptySExp => {
    if(pairs.length === 0)
        return L3val.makeEmptySExp();
    else
        return L3val.makeCompoundSExp(L3val.makeCompoundSExp(pairs[0].var, simpleEval(pairs[0].val)),
            pairs2LitList(pairs.slice(1)));
}

//Helper function to array2LitList
//If the val in a pair is a simple value - we return its value
//For all other values for a pair (closure, dict...)
//         we give back an L3's
//     !!  list of all the args  !!
const simpleEval = (exp: L32.CExp): L3val.SExpValue => {
    if (L32.isNumExp(exp) || L32.isBoolExp(exp) || L32.isStrExp(exp)) {
        return exp.val;
    } 
    else if (L32.isLitExp(exp)) {
        return convertSExp(exp.val);
    } 
    else if (L32.isIfExp(exp)){
        const elements = [L3val.makeSymbolSExp("if"), simpleEval(exp.test), simpleEval(exp.then), simpleEval(exp.alt)];
        return array2LitList(elements);
    }
    else if(L32.isAppExp(exp)){
        const elements = [simpleEval(exp.rator), ... exp.rands.map(simpleEval)];
        return array2LitList(elements);
    }
    else if(L32.isProcExp(exp)){
        const argSymbols = exp.args.map(v => L3val.makeSymbolSExp(v.var));

        // Convert args to a sublist
        const argsList = array2LitList(argSymbols);

        const elements = [L3val.makeSymbolSExp("lambda"), argsList, ...exp.body.map(simpleEval)];
        return array2LitList(elements);
    }
    else if(L32.isDictExp(exp)){
        const pairs = exp.pairs.map(pair => 
            simpleEval(L32.makeAppExp(L32.makeLitExp(pair.var), [pair.val]))
        );
        const elements = [L3val.makeSymbolSExp("dict"), ...pairs];
        return array2LitList(elements);
    }
    else if (L32.isLetExp(exp)) {
        // Any complex expressions get unparsed and wrapped as symbols
        const unparsed = L32.unparseL32(exp);
        const sym = unparsed.startsWith("'") ? unparsed.slice(1) : unparsed;
        return L3val.makeSymbolSExp(sym);
    } 
    else {
        // Fallback for anything else
        const unparsed = L32.unparseL32(exp);
        return L3val.makeSymbolSExp(unparsed);
    }
};

//Takes an array of SExpValues and turns them into a list in L3 style
const array2LitList = (arr: L3val.SExpValue[]): L3val.CompoundSExp | L3val.EmptySExp =>{
    if(arr.length===0)
        return L3val.makeEmptySExp();
    else
        return L3val.makeCompoundSExp(arr[0], array2LitList(arr.slice(1)));}






/*
Purpose: Transform L32 program to L3
Signature: L32ToL3(prog)
Type: Program -> Program
*/
export const L32toL3 = (prog : L32.Program): L3.Program =>{
    const convertedL32Exps = convertSequence(prog.exps);
    return L3.makeProgram([...dictSupport(),...convertedL32Exps]);
}



const dictSupport = (): L3.Exp[] => {
    const code = `(L3
        (define assoc
            (lambda (key pairs)
                (if (pair? pairs)
                    (if (eq? key (car (car pairs)))
                        (car pairs)
                        (assoc key (cdr pairs)))
                    #f)))
        
        (define error
            (lambda (msg)
                (list 'error msg)))

        (define is-error?
            (lambda (v)
                (if (pair? v)
                    (eq? (car v) 'error)
                    #f)))
        
        (define bind
            (lambda (v f)
                (if (is-error? v)
                    v
                    (f v))))

        (define dict
            (lambda (pairs)
                (lambda (key)
                    ((lambda (found)
                        (if (eq? found #f)
                            (error "key not found")
                            (cdr found)))
                     (assoc key pairs)))))
    )`;

    const result = L3.parseL3(code);
    if (isOk(result) && L3.isProgram(result.value))
        return result.value.exps;
    else
        throw new Error("Failed to parse dict support code.");
};







