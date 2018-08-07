const fs = require('fs');
const parse = require('./parse');

const loadFile = (path) => fs.readFile(path, 'utf8', (err, source)=>{
    if (err) throw err;
    const parseResult = parse(source);
    console.log('parseResult-------');
    console.log(parseResult);
})

// 浏览器端复用符合CommonJS规范的代码模块
loadFile('./code.js');