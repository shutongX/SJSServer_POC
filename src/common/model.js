import {DEFAULT_SHEET_ROW_COUNT, DEFAULT_SHEET_COL_COUNT} from './defaults'

export class SharedModel {
    _sharedValues;

    constructor() {
        this._sharedValues = [];
    }

    getIndex(value) {
        let index = this._sharedValues.indexOf(value);
        if (index === -1) {
            index = this._sharedValues.length;
            this._sharedValues.push(value);
        }
        return index;
    }

    getValue(index) {
        return this._sharedValues[index];
    }

    dispose() {
        this._sharedValues = null;
    }
}

export class DataModel {

    _valueModel;
    _rowCount;
    _colCount;
    // _formulaModel;
    // _styleModel;

    constructor(rowCount, colCount) {
        this._valueModel = {};
        this._rowCount = rowCount || DEFAULT_SHEET_ROW_COUNT;
        this._colCount = colCount || DEFAULT_SHEET_COL_COUNT;
    }

    // value is untyped string or number.
    setValue(row, col, value) {
        if (!this._valueModel[row]) {
            this._valueModel[row] = {};
        }
        this._valueModel[row][col] = value;
    }

    getValue(row, col) {
        return this._valueModel[row]?.[col];
    }

    getRowCount() {
        return this._rowCount;
    }

    getColCount() {
        return this._colCount;
    }

    toJSON() {
        return JSON.stringify(this._valueModel);
    }

    dispose() {
        this._valueModel = null;
    }
}
