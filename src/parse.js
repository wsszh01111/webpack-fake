const esprima = require("esprima");

/**
 * traverse AST with DFS（depth first search）
 * Learn more about Parser API:https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
 * Learn more about esprima:http://esprima.readthedocs.io/en/latest/getting-started.html
 * Question:
 *     - when could MethodDefinition.value be an 'null'
 */

// parse Statements and Declarations Ref:http://esprima.readthedocs.io/en/latest/syntax-tree-format.html#statements-and-declarations
const parseStatement = (statement) => {
    switch(statement.type){
        case 'BlockStatement':
            statement.body.forEach(statementListItem=>parseStatement(statementListItem)) //BlockStatement.body=>StatementListItem[] StatementListItem = Declaration | Statement;
            break;
        case 'ClassDeclaration': //ClassDeclaration.body=>ClassBody
            parseClass(statement.body);
            break;
        case 'DoWhileStatement': //DoWhileStatement.body=>Statement
            parseStatement(statement.body);
            break;
        case 'ExpressionStatement': //ExpressionStatement.expression=>Expression
            parseExpression(statement.expression);
            break;
        case 'ForStatement':
            if (statement.init) { //ForStatement.init=>Expression | VariableDeclaration | null
                if (statement.init.type === 'VariableDeclaration') {
                    parseStatement(statement.init);
                }else{
                    parseExpression(statement.init);
                }
            }
            if (statement.test) { //ForStatement.test=>Expression | null
                parseExpression(statement.test);
            }
            if (statement.update) { //ForStatement.update=>Expression | null
                parseExpression(statement.update);
            }
            parseStatement(statement.body); //ForStatement.body=>Statement
            break;
        case 'ForInStatement' || 'ForOfStatement':
            parseExpression(statement.right); //ForInStatement.right|ForOfStatement.right=>Expression
            parseStatement(statement.body); //ForInStatement.body|ForOfStatement.body=>Statement
            break;
        case 'FunctionDeclaration':
            parseStatement(statement.body); //FunctionDeclaration.body=>BlockStatement
            break;
        case 'IfStatement':
            parseExpression(statement.test); //IfStatement.test=>Expression
            parseStatement(statement.consequent); //IfStatement.consequent=>Statement
            break;
        case 'LabeledStatement':
            parseStatement(statement.body); //LabeledStatement.body=>Statement
            break;
        case 'ReturnStatement':
            if (statement.argument) {
                parseExpression(statement.argument); //ReturnStatement.argument=>Expression | null;
            }
            break;
        case 'SwitchStatement':
            parseExpression(statement.discriminant); //SwitchStatement.discriminant=>Expression
            statement.cases.forEach(switchCase=>parseSwitch(switchCase)); //SwitchStatement.cases=>SwitchCase[]
            break;
        case 'ThrowStatement':
            parseExpression(statement.argument); //ThrowStatement.argument=>Expression
            break;
        case 'TryStatement':
            if (statement.handler) { //TryStatement.handler=>CatchClause | null
                parseTry(statement.handler);
            }
            if (statement.finalizer) { //TryStatement.finalizer=>BlockStatement | null
                parseStatement(statement.finalizer);
            }
            parseStatement(statement.block); //TryStatement.block=>BlockStatement
            break;
        case 'VariableDeclaration': //VariableDeclaration.declarations=>VariableDeclarator[]
            statement.declarations.forEach(variableDeclarator=>parseVariable(variableDeclarator));
            break;
        case 'WhileStatement':
            parseExpression(statement.test); //WhileStatement.test=>Expression
            parseStatement(statement.body); //WhileStatement.body=>Statement
            break;
        case 'WithStatement':
            parseExpression(statement.object); //WithStatement.object=>Expression
            parseStatement(statement.body); //WithStatement.body=>Statement
            break;
        default :
            // do nothing
            // include BreakStatement/ContinueStatement/DebuggerStatement/EmptyStatement
            break;
    }
}

// parse Expressions and Patterns Ref:http://esprima.readthedocs.io/en/latest/syntax-tree-format.html#expressions-and-patterns
const parseExpression = (expression) => {
    switch(expression.type){
        case 'FunctionExpression':
            parseStatement(expression.body); //FunctionExpression.body=>BlockStatement
            break;
        case 'ArrayPattern': 
            //ArrayPattern.elements=>ArrayPatternElement[]
            //type ArrayPatternElement = AssignmentPattern | Identifier | BindingPattern | RestElement | null;
            expression.elements.forEach(element=>element?parseExpression(element):null);
            break;
        case 'AssignmentPattern':
            parseExpression(expression.left); //AssignmentPattern.left=>Identifier | BindingPattern
            parseExpression(expression.right); //AssignmentPattern.right=>Expression
            break;
        case 'RestElement': //RestElement.argument=>Identifier | BindingPattern
            parseExpression(expression.argument);
            break;
        case 'ObjectPattern': //ObjectPattern.properties=>Property[]
            expression.proproperties.forEach(property=>parseExpression(property));
            break;
        case 'Property':
            parseExpression(expression.key);
            if (expression.value) {
                parseExpression(expression.value);
            }
            break;
        case 'ArrayExpression':
            // ArrayExpression.elements=>ArrayExpressionElement[]
            // type ArrayExpressionElement = Expression | SpreadElement;
            expression.elements.forEach(element=>parseExpression(element));
            break;
        case 'SpreadElement':
            parseExpression(expression.argument);
            break;
        case 'ObjectExpression':
            expression.proproperties.forEach(property=>parseExpression(property));
            break;
        case 'FunctionExpression':
            expression.params.forEach(param=>parseExpression(param))
            parseStatement(expression.body);
            break;
        case 'ArrowFunctionExpression':
            expression.params.forEach(param=>parseExpression(param))
            if (expression.body.type === 'BlockStatement') {
                parseStatement(expression.body);
            }else{ //Expression
                parseExpression(expression.body);
            }
            break;
        case 'ClassExpression':
            parseClass(expression.body);
            break;
        case 'TaggedTemplateExpression':
            parseExpression(expression.tag);
            parseTemplate(expression.quasi);
            break;
        case 'MemberExpression':
            parseExpression(expression.object);
            parseExpression(expression.property);
            break;
        case 'CallExpression':
            if (expression.callee.name === 'require') {
                if (expression.arguments.length > 0) {
                    expression.arguments[0].value;
                }
            }else{
                expression.arguments.forEach(argument=>parseExpression(argument));
            }
            break;
        case 'NewExpression':
            parseExpression(expression.callee);
            expression.arguments.forEach(argument=>parseExpression(argument));
            break;
        case 'UpdateExpression':
            parseExpression(expression.argument);
            break;
        case 'AwaitExpression':
            parseExpression(expression.argument);
            break;
        case 'UnaryExpression':
            parseExpression(expression.argument);
            break;
        case 'BinaryExpression':
            parseExpression(expression.left);
            parseExpression(expression.right);
            break;
        case 'LogicalExpression':
            parseExpression(expression.left);
            parseExpression(expression.right);
            break;
        case 'ConditionalExpression':
            parseExpression(expression.test);
            parseExpression(expression.consequent);
            parseExpression(expression.alternate);
            break;
        case 'YieldExpression':
            if (expression.argument) {
                parseExpression(expression.argument);
            }
            break;
        case 'AssignmentExpression':
            parseExpression(expression.left);
            parseExpression(expression.right);
            break;
        case 'SequenceExpression':
            expression.expressions.forEach(e=>parseExpression(e));
            break;
        default:
            // do nothing
            // include Identifier/ThisExpression/Literal/Super/MetaProperty
            break;
    }
}

const parseTemplate = (templateContent) => {
    switch(templateContent.type){
        case 'TemplateLiteral':
            templateContent.expressions.forEach(expression=>parseExpression(expression));
            break;
        default:
            // include TemplateElement
            break;
    }
}

// parse Switch Statement's SwitchCase Ref:http://esprima.readthedocs.io/en/latest/syntax-tree-format.html#switch-statement
const parseSwitch = (switchContent) => {
    switch(switchContent.type){
        case 'SwitchCase':
            if (switchContent.test) {
                parseExpression(switchContent.test);
            }
            switchContent.consequent.forEach(statement=>parseStatement(statement));
            break;
        default:
            break;
    }
}

// parse Class Expression and Class Declaration's ClassBody and MethodDefinition Ref:http://esprima.readthedocs.io/en/latest/syntax-tree-format.html#class-expression
const parseClass = (classContent) => {
    switch(classContent.type){
        case 'ClassBody': //ClassBody.body=>MethodDefinition[]
            classContent.body.forEach(methodDefinition=>parseClass(methodDefinition));
            break;
        case 'MethodDefinition':
            if (classContent.value) { //MethodDefinition.value=>FunctionExpression | null
                parseExpression(classContent.value);
            }
            break;
        default:
            break;
    }
}

// parse Try Statement's CatchClause Ref:http://esprima.readthedocs.io/en/latest/syntax-tree-format.html#try-statement
const parseTry = (tryContent) => {
    switch(tryContent.type){
        case 'CatchClause': //CatchClause.body=>BlockStatement
            parseStatement(tryContent.body);
            break;
        default:
            break;
    }
}

// parse Variable Declaration's VariableDeclarator Ref:http://esprima.readthedocs.io/en/latest/syntax-tree-format.html#variable-declaration
const parseVariable = (variableContent) => {
    switch(variableContent.type){
        case 'VariableDeclarator': //VariableDeclarator.init=>Expression | null
            if (variableContent.init) {
                parseExpression(variableContent.init);
            }
            break;
        default:
            break;
    }
}

module.exports = (source) => {
    const ast = esprima.parseModule(source);
    resolveStatement(ast.body);
}