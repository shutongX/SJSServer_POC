class SharedModel {
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

class DataModel {

    _valueModel;
    _rowCount;
    _colCount;
    // _formulaModel;
    // _styleModel;

    constructor(rowCount, colCount) {
        this._valueModel = {};
        this._rowCount = rowCount || 10;
        this._colCount = colCount || 5;
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

    // toSparseArray() {
    //     const map = this._valueModel;
    //     for (let i = 0; i < this._rowCount; i++) {
    //         for (let j = 0; j < this._colCount; j++) {
    //             const value = map.get(i)?.get(j);
    //             if (value !== undefined) {
    //                 if (sparseArray[i] === undefined) {
    //                     sparseArray[i] = {};
    //                 }
    //                 sparseArray[i][j] = value;
    //             }
    //         }
    //     }

    //     return sparseArray;
    // }

    // flat() {
    //     return this.toSparseArray().flat();
    // }

    dispose() {
        this._valueModel = null;
    }
}
