const esprima = require("esprima");

/**
 * traverse AST with DFS（depth first search）
 */

// traverse Statement
const resolveStatement = (statement) => {
    switch(statement.type){
        
    }
}

// traverse Expression
const resolveExpression = (expression) => {
    switch(expression.type){
        
    }
}

module.exports = (source) => {
    const ast = esprima.parseModule(source);
    resolveStatement(ast.body);
}