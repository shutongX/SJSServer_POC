import * as GC from '../../dist/bundle.js';
// const GC = require('../../dist/bundle.js');

let spread = new GC.Workbook();
let sheet = spread.getActiveSheet();
sheet.setValue(0, 0, 'Hello world!');
console.log(sheet.getValue(0, 0));