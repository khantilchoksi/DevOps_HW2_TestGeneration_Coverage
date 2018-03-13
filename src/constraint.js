// Core/NPM Modules
const esprima = require("esprima");
const faker   = require("faker");
const fs      = require('fs');
const Random  = require('random-js');
const _       = require('lodash');
const randexp = require('randexp');



// Set options
faker.locale  = "en";
const options = { tokens: true, tolerant: true, loc: true, range: true };

//console.log("\n Fake Number: ",faker.phone.phoneNumberFormat());

// Create random generator engine
const engine = Random.engines.mt19937().autoSeed();


/**
 * Constraint class. Represents constraints on function call parameters.
 *
 * @property {String}                                                          ident      Identity of the parameter mapped to the constraint.
 * @property {String}                                                          expression Full expression string for a constraint.
 * @property {String}                                                          operator   Operator used in constraint.
 * @property {String|Number}                                                   value      Main constraint value.
 * @property {String|Number}                                                   altvalue   Constraint alternative value.
 * @property {String}                                                          funcName   Name of the function being constrained.
 * @property {'fileWithContent'|'fileExists'|'integer'|'string'|'phoneNumber'} kind       Type of the constraint.
 */
class Constraint {
    constructor(properties){
        this.ident = properties.ident;
        this.expression = properties.expression;
        this.operator = properties.operator;
        this.value = properties.value;
        this.altvalue = properties.altvalue;
        this.funcName = properties.funcName;
        this.kind = properties.kind;
    }
}


/**
 * Generate function parameter constraints for an input file
 * and save them to the global functionConstraints object.
 *
 * @param   {String} filePath Path of the file to generate tests for.
 * @returns {Object}          Function constraints object.
 */
function constraints(filePath) {

    // Initialize function constraints directory
    let functionConstraints = {};

    // Read input file and parse it with esprima.
    let buf = fs.readFileSync(filePath, "utf8");
    let result = esprima.parse(buf, options);

    // Start traversing the root node
    traverse(result, function (node) {

        // If some node is a function declaration, parse it for potential constraints.
        if (node.type === 'FunctionDeclaration') {

            // Get function name and arguments
            let funcName = functionName(node);
            let params = node.params.map(function(p) {return p.name});

            // Initialize function constraints
            functionConstraints[funcName] = {
                constraints: _.zipObject(params, _.map(params, () => [])),
                params: params
            };

            //Generating test cases for format function's test argument phoneNumber 
            if(funcName == "format"){
                //console.log("\n Got the function name: ",funcName);

                //let expression = buf.substring(child.range[0], child.range[1]);
                
                for (let p in params) {
                    //console.log("\n p ",params[p]);
                    if( params[p] === "phoneNumber") {
                        var fakerNum = faker.phone.phoneNumberFormat(1);
                        let ident = params[p];
                        // Push a new constraint
                        functionConstraints[funcName].constraints[ident].push(new Constraint({
                            ident: ident,
                            value:  `'${fakerNum}'`,
                            funcName: funcName,
                            kind: "string"
                        }));
                    }
                }
            }

            // Traverse function node.
            traverse(node, function(child) {

                //Handle all binary combinations
                binaryExpressionTestCaseGenerations(buf, params, functionConstraints, funcName, child);
                

                //Handling LogicalExpression
                // if(_.get(child, 'type') === 'LogicalExpression' && _.includes(['&&'], _.get(child, 'operator'))) {
                //     if(_.get(child, 'left.type') === 'BinaryExpression') {

                //         binaryExpressionTestCaseGenerations(buf, params, functionConstraints, funcName, child.right);
                //     }

                //     if(_.get(child, 'right.type') === 'BinaryExpression') {
                //         binaryExpressionTestCaseGenerations(buf, params, functionConstraints, funcName, child.right);
                //     }   

                // }else {
                //     binaryExpressionTestCaseGenerations(buf, params, functionConstraints, funcName, child);
                // }


                // Handle fs.readFileSync
                if( child.type === "CallExpression" && child.callee.property && child.callee.property.name === "readFileSync" ) {

                    // Get expression from original source code:
                    let expression = buf.substring(child.range[0], child.range[1]);

                    for (let p in params) {
                        //console.log("\n p ",params[p]);
                        if( child.arguments[0].name === params[p] ) {
                            //console.log("\n child.arguments[0].name",child.arguments[0].name);
                            // Get identifier
                            let ident = params[p];

                            // Push a new constraint
                            functionConstraints[funcName].constraints[ident].push(new Constraint({
                                ident: params[p],
                                value:  "'pathContent/file1'",
                                funcName: funcName,
                                kind: "fileWithContent",
                                operator : child.operator,
                                expression: expression
                            }));
                            functionConstraints[funcName].constraints[ident].push(new Constraint({
                                ident: params[p],
                                value:  "'pathContent/someDir'",
                                funcName: funcName,
                                kind: "fileWithContent",
                                operator : child.operator,
                                expression: expression
                            }));
                            functionConstraints[funcName].constraints[ident].push(new Constraint({
                                ident: params[p],
                                value:  "'file'",
                                funcName: funcName,
                                kind: "fileExists",
                                operator : child.operator,
                                expression: expression
                            }));
                        }
                    }
                }

                //Handling dir 
                if( child.type === "CallExpression" && child.callee.property && child.callee.property.name === "readdirSync" ) {
                    
                    // Get expression from original source code:
                    let expression = buf.substring(child.range[0], child.range[1]);

                    for (let p in params) {
                        //console.log("\n p ",params[p]);
                        if( child.arguments[0].name === params[p] ) {
                            //console.log("\n readdirSync child.arguments[0].name",child.arguments[0].name);
                            // Get identifier
                            let ident = params[p];

                            // Push a new constraint
                            functionConstraints[funcName].constraints[ident].push(new Constraint({
                                ident: params[p],
                                value:  "'nonEmptyDir'",
                                funcName: funcName,
                                kind: "fileExists",
                                operator : child.operator,
                                expression: expression
                            }));
                            functionConstraints[funcName].constraints[ident].push(new Constraint({
                                ident: params[p],
                                value:  "'emptyDir'",
                                funcName: funcName,
                                kind: "fileExists",
                                operator : child.operator,
                                expression: expression
                            }));
                        }
                    }
                }





                if(_.get(child, 'type') === 'UnaryExpression' && _.includes(['!'], _.get(child, 'operator'))) {
                    if( child.argument.object && child.argument.type === 'MemberExpression'){
                        
                        // Get expression from original source code:
                        let expression = buf.substring(child.range[0], child.range[1]);
                        
                        let propertyName = child.argument.property.name;
        
                        for (let p in params) {
                            //console.log("\n p ",params[p]);
                            if( child.argument.object.name === params[p] ) {
                                //console.log("\n UnaryExpression Param Ident: ",params[p]);
                                // Get identifier
                                let ident = params[p];

                                // Push a new constraints
                                let constraints = functionConstraints[funcName].constraints[ident];
                                constraints.push(new Constraint({
                                    ident: ident,
                                    value: `{'${propertyName}' : true}`,       //!options.attribute -> false
                                    funcName: funcName,
                                    kind: "string",
                                    operator : child.operator,
                                    expression: expression
                                }));

                                
                                constraints.push(new Constraint({
                                    ident: ident,
                                    value: `{'${propertyName}' : false}`,       //!options.attribute -> true
                                    funcName: funcName,
                                    kind: "string",
                                    operator : child.operator,
                                    expression: expression
                                }));

                                constraints.push(new Constraint({
                                    ident: ident,
                                    value: false,                                  
                                    funcName: funcName,
                                    kind: "string",
                                    operator : child.operator,
                                    expression: expression
                                }));


                                constraints.push(new Constraint({
                                    ident: ident,
                                    value: true,                                  
                                    funcName: funcName,
                                    kind: "string",
                                    operator : child.operator,
                                    expression: expression
                                }));


                                // constraints.push(new Constraint({
                                //     ident: ident,
                                //     value: '',       
                                //     funcName: funcName,
                                //     kind: "string",
                                //     operator : child.operator,
                                //     expression: expression
                                // }));


                            }
                        }



                    }
                        
                    
                }



            });

            // console.log( functionConstraints[funcName]);

        }
    });

    return functionConstraints;
}

/**
 * Traverse an object tree, calling the visitor at each
 * visited node.
 *
 * @param {Object}   object  Esprima node object.
 * @param {Function} visitor Visitor called at each node.
 */
function traverse(object, visitor) {

    // Call the visitor on the object
    visitor(object);

    // Traverse all children of object
    for (let key in object) {
        if (object.hasOwnProperty(key)) {
            let child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}


/**
 * Return the name of a function node.
 */
function functionName(node) {
    return node.id ? node.id.name : '';
}


/**
 * Generates an integer value based on some constraint.
 *
 * @param   {Number}  constraintValue Constraint integer.
 * @param   {Boolean} greaterThan     Whether or not the concrete integer is greater than the constraint.
 * @returns {Number}                  Integer satisfying constraints.
 */
function createConcreteIntegerValue(constraintValue, greaterThan) {
    if( greaterThan ) return Random.integer(constraintValue + 1, constraintValue + 10)(engine);
    else return Random.integer(constraintValue - 10, constraintValue - 1)(engine);
}

/**
 * Generates test cases for binary expressions!
 *
 * @param   {Number}  constraintValue Constraint integer.
 * @param   {Boolean} greaterThan     Whether or not the concrete integer is greater than the constraint.
 * @returns {Void}                    Returns nothing
 */
function binaryExpressionTestCaseGenerations(buf, params, functionConstraints, funcName, child) {
    // Handle equivalence expression
    if(_.get(child, 'type') === 'BinaryExpression' && _.includes(['!=', '!==', '==', '==='], _.get(child, 'operator'))) {
        if(_.get(child, 'left.type') === 'Identifier') {

            // Get identifier
            let ident = child.left.name;
            //console.log("Identifier: ",ident);
            // Get expression from original source code:
            let expression = buf.substring(child.range[0], child.range[1]);
            let rightHand = buf.substring(child.right.range[0], child.right.range[1]);

            // Test to see if right hand is a string
             let match = rightHand.match(/^['"](.*)['"]$/);

            if (_.includes(params, _.get(child, 'left.name'))) {
                //console.log("Identifier: ",ident);
                // Push a new constraints
                let constraints = functionConstraints[funcName].constraints[ident];
                constraints.push(new Constraint({
                    ident: child.left.name,
                    value: rightHand,       //p less one to make condition true ????? parseInt(rightHand - 1)
                    funcName: funcName,
                    kind: "integer",
                    operator : child.operator,
                    expression: expression
                }));
                constraints.push(new Constraint({
                    ident: child.left.name,
                    value: match ? `'NEQ - ${match[1]}'` : NaN,
                    funcName: funcName,
                    kind: "integer",
                    operator : child.operator,
                    expression: expression
                }));
            }
        } else if( _.get(child, 'left.type') === "CallExpression" && child.left.callee.property 
        && child.left.callee.property.name === "indexOf" ) {
            //Handling String IndexOf
            // Get expression from original source code:
            let expression = buf.substring(child.range[0], child.range[1]);
            
            // Get identifier
            let ident = child.left.callee.object.name;
            let givenStr = child.left.arguments[0].value;

            let rightHand = buf.substring(child.right.range[0], child.right.range[1]);
            //console.log(" RHS: ",parseInt(rightHand));
            let indexOffsetCount = parseInt(rightHand);
            let fakeString = "";
            for(var i = 0; i<indexOffsetCount;i++){
                fakeString += "*";
            }

            givenStr = fakeString + givenStr;

            // Push a new constraint
            let constraints = functionConstraints[funcName].constraints[ident];
            constraints.push(new Constraint({
                ident: ident,
                value:  `'${givenStr}'`,
                funcName: funcName,
                kind: "string",
                operator : child.operator,
                expression: expression
            }));
            constraints.push(new Constraint({
                ident: ident,
                value:  `'`+faker.random.word()+`'`,
                funcName: funcName,
                kind: "string",
                operator : child.operator,
                expression: expression
            }));
        }
        if(_.get(child, 'left.type') === "Identifier"  && child.left.name === "area" ) {

            // Get expression from original source code:
            let expression = buf.substring(child.range[0], child.range[1]);
            
            // Get identifier
            let ident = params[0];
            var fakerNum = faker.phone.phoneNumberFormat(1);
            let rightHand = buf.substring(child.right.range[0], child.right.range[1]);
            //console.log("\n AREA: ",rightHand);
            let areaCode = parseInt(rightHand.substring(1, rightHand.length-1));   //because right hand has "212"
            //let areaCode = parseInt(rightHand);
            //console.log("\n AREA CODE: ",areaCode);
            // Push a new constraint
            functionConstraints[funcName].constraints[ident].push(new Constraint({
                ident: ident,
                value:  `'${fakerNum}'`,
                funcName: funcName,
                kind: "string", 
                operator : child.operator,
                expression: expression
            }));
            functionConstraints[funcName].constraints[ident].push(new Constraint({
                ident: ident,
                value:  `'${areaCode}1234567'`,
                funcName: funcName,
                kind: "string",
                operator : child.operator,
                expression: expression
            }));
        }
    }

    //Handle <, <= expression
    if(_.get(child, 'type') === 'BinaryExpression' && _.includes(['<','<='], _.get(child, 'operator'))) {
        if(_.get(child, 'left.type') === 'Identifier') {

            // Get identifier
            let ident = child.left.name;

            // Get expression from original source code:
            let expression = buf.substring(child.range[0], child.range[1]);
            let rightHand = buf.substring(child.right.range[0], child.right.range[1]);

            // Test to see if right hand is a string
             let match = rightHand.match(/^['"](.*)['"]$/);

            if (_.includes(params, _.get(child, 'left.name'))) {

                // Push a new constraints
                let constraints = functionConstraints[funcName].constraints[ident];
                constraints.push(new Constraint({
                    ident: child.left.name,
                    value: parseInt(rightHand) - 1,       //p less one to make condition true ????? parseInt(rightHand - 1)
                    funcName: funcName,
                    kind: "integer",
                    operator : child.operator,
                    expression: expression
                }));
                constraints.push(new Constraint({
                    ident: child.left.name,
                    value: parseInt(rightHand) + 1,        //match ? `'NEQ - ${match[1]}'` : NaN
                    funcName: funcName,
                    kind: "integer",
                    operator : child.operator,
                    expression: expression
                }));
            }
        }
    }

    //Handle >, >= expression
    if(_.get(child, 'type') === 'BinaryExpression' && _.includes(['>','>='], _.get(child, 'operator'))) {
        if(_.get(child, 'left.type') === 'Identifier') {

            // Get identifier
            let ident = child.left.name;

            // Get expression from original source code:
            let expression = buf.substring(child.range[0], child.range[1]);
            let rightHand = buf.substring(child.right.range[0], child.right.range[1]);

            // Test to see if right hand is a string
             let match = rightHand.match(/^['"](.*)['"]$/);

            if (_.includes(params, _.get(child, 'left.name'))) {

                // Push a new constraints
                let constraints = functionConstraints[funcName].constraints[ident];
                constraints.push(new Constraint({
                    ident: child.left.name,
                    value: parseInt(rightHand) + 1,       //If condition passes
                    funcName: funcName,
                    kind: "integer",
                    operator : child.operator,
                    expression: expression
                }));
                constraints.push(new Constraint({
                    ident: child.left.name,
                    value: parseInt(rightHand) - 1,        //If condition fails
                    funcName: funcName,
                    kind: "integer",
                    operator : child.operator,
                    expression: expression
                }));
            }
        }
    }
}




// Export
module.exports = constraints;