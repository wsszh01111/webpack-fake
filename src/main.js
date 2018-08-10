const fs = require('fs');
const parse = require('./parse');
// Ref:https://github.com/webpack/webpack/tree/2e1460036c5349951da86c582006c7787c56c543
const loadFile = (path) => fs.readFile(path, 'utf8', (err, source)=>{
    if (err) throw err;
    const parseResult = parse(source);
    console.log('parseResult-------');
    console.log(parseResult);
})

// 浏览器端复用符合CommonJS规范的代码模块
loadFile('./code.js');