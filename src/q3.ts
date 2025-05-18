import { map } from 'ramda';
import { AppExp, DefineExp, Exp, IfExp, isAppExp, isBoolExp, isDefineExp, isIfExp, isLetExp, isLitExp, isNumExp, isPrimOp, isProcExp, isProgram, isStrExp, isVarRef, LitExp, PrimOp, ProcExp, Program } from './L3/L3-ast';
import { isCompoundSExp, isEmptySExp, valueToString } from './L3/L3-value';
import { Result, makeFailure, makeOk} from './shared/result';

/*
Purpose: Transform L2 AST to JavaScript program string
Signature: l2ToJS(l2AST)
Type: [EXP | Program] => Result<string>
*/

export const l2ToJS = (exp: Exp | Program): Result<string>  => 
    makeOk(convert(exp));

const convert = (exp: Exp | Program) : string =>{
    if(isBoolExp(exp))
        return valueToString(exp.val);
    else if(isNumExp(exp))
        return valueToString(exp.val);
    else if(isStrExp(exp))
        return valueToString(exp.val);
    //else if(isLitExp(exp))
        //makeOk(lit2JS(exp))
    else if(isVarRef(exp))
        return exp.var;
    else if(isProcExp(exp))
        return proc2JS(exp);
    else if(isIfExp(exp))
        return if2JS(exp);
    else if(isAppExp(exp))
        return app2JS(exp);
    else if(isPrimOp(exp))
        return exp.op;
    else if(isDefineExp(exp))
        return define2JS(exp);
    else if(isProgram(exp))
        return program2JS(exp);
    return "";
}

// const lit2JS = (le: LitExp): string =>{
//     isEmptySExp(le.val) ? `'${valueToString(le.val)}` :
//     isCompoundSExp(le.val) ? `'${valueToString(le.val)}` :
//     `${le.val}`;
// }
    

const proc2JS = (le: ProcExp): string =>
    "(" + `(${le.args.map(v => v.var).join(",")})` + " => " + map(convert, le.body) + ")"

const if2JS = (le: IfExp):string =>
    "(" + convert(le.test) + " ? " + convert(le.then) + " : " + convert(le.alt) +")"

const app2JS = (le: AppExp): string =>{
    if(isPrimOp(le.rator)){
        return primop2JS(le);
    }
    else if(isProcExp(le.rator)){
        return proc2JS(le.rator) + `(${le.rands.map(v => convert(v)).join(",")})`;
    }
    else if(isVarRef(le.rator)){
        return le.rator.var + `(${le.rands.map(v => convert(v)).join(",")})`;
    }
    return "error in AppExp";

}

const primop2JS = (le:AppExp): string =>{
    if(isPrimOp(le.rator)){
        if(le.rator.op==="+" || le.rator.op === "-" || le.rator.op==="*" || le.rator.op === "/")
            return `(${le.rands.map(v => convert(v)).join(" " + le.rator.op +" ")})`;
        else if(le.rator.op === ">" ||le.rator.op === "<")
            return "(" + convert(le.rands[0]) + " " + le.rator.op+  " " + convert(le.rands[1]) +")";
        else if(le.rator.op === "=")
            return "(" + convert(le.rands[0]) + " === " + convert(le.rands[1]) +")";
        else if(le.rator.op === "number?"){
            return ("(typeof "+ convert(le.rands[0]) + " === 'number')")
        }
        else if(le.rator.op === "boolean?"){
            return ("(typeof "+ convert(le.rands[0]) + " === 'boolean')")
        }
        else if(le.rator.op === "eq?"){
            return "(" + convert(le.rands[0]) +" === " + convert(le.rands[1]) +")";
        }
        else if(le.rator.op === "and"){
            return "(" + convert(le.rands[0]) +" && " + convert(le.rands[1]) +")";
        }
        else if(le.rator.op === "or"){
            return "(" + convert(le.rands[0]) +" || " + convert(le.rands[1]) +")";
        }
        else if(le.rator.op === "not"){
            return "(!" + convert(le.rands[0]) +")";
        }
    }
    return "error in primOp";
}

const define2JS = (le: DefineExp): string =>
    "const " + le.var.var + " = " + convert(le.val);

const program2JS = (le: Program): string =>
    map(convert, le.exps).join(";\n");

    