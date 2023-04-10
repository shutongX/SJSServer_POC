const DEFAULT_WORKBOOK_OPTIONS = {
    sheetCount: 1,
};

const DEFAULT_SHEET_ROW_COUNT = 10;
const DEFAULT_SHEET_COL_COUNT = 5;

const USER_STATUS = {
    inactivated: 0,
    activated: 1,
    '0': 'inactivated',
    '1': 'activated'
};

const USER_PRIORITY = {
    none: 0,
    read: 1,
    write: 3,
    admin: 5
};

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

function isNullOrUndefined(value) {
    return value === void 0 || value === null;
}

class Command {
    _owner;
    _cmdDef;
    _name;

    constructor(owner, cmdDef, name) {
        this._owner = owner;
        this._cmdDef = cmdDef;
        this._name = name;
    }

    execute(context, options, isUndo) {
        let self = this, ret;
        let fn = self._cmdDef.execute || self._cmdDef;
        try {
            ret = fn(context, options, isUndo);
        } catch (e) {
        }
        return ret;
    }
}

class CommandManager {
    _context;

    constructor(context) {
        this._context = context;
    }

    register(name, command) {
        let self = this;
        let cmd = new Command(self, command, name);
        self[name] = cmd;
    }

    execute(commandOptions) {
        let cmd = this[commandOptions.cmd];
        if (cmd) {
            return cmd.execute(this._context, commandOptions, false /* isUndo */);
        }
    }

    undo(userName) {

    }

    redo(userName) {

    }
    dispose() {
        this._context = null;
    }

}

class ModelManager {

    _historyPool;
    _changesPool;

    _sharedModel;
    _dataModel;
    _context;

    constructor(context) {
        this._context = context;
        this._dataModel = {};
        this._sharedModel = new SharedModel();
        this._historyPool = new Map();
        this._changesPool = new Map();
    }

    getSharedModel() {
        return this._sharedModel;
    }

    getSheetModel(sheetName) {
        return this._dataModel[sheetName];
    }

    do(methodName, ...methodArgs) {
        let self = this;
        if (methodName) {
            let method = self[methodName];
            method && method.apply(self, methodArgs);
        }
    }

    addSheet(sheetName) {
        this._dataModel[sheetName] = new DataModel(DEFAULT_SHEET_ROW_COUNT, DEFAULT_SHEET_COL_COUNT);
    }

    removeSheet(sheetName) {
        this._dataModel[sheetName] = null;
    }

    setValue(sheetName, row, col, value) {
        let index = this._sharedModel.getIndex(value);
        this._dataModel[sheetName].setValue(row, col, index);
    }

    getValue(sheetName, row, col) {
        let index = this._dataModel[sheetName].getValue(row, col);
        return this._sharedModel.getValue(index);
    }

    startTransaction(userName) {
        if (!userName) return;
        let changesPool = this._changesPool;
        if (!changesPool.has(userName)) {
            changesPool.set(userName, []);
        }
    }

    endTransaction(userName) {
        let self = this;
        if (!userName || !self._changesPool.has(userName)) return;
        let changesPool = self._changesPool;
        let historyPool = self._historyPool;
        let changes = self._changesPool.get(userName);
        if (changes && changes.length) {
            if (!historyPool.has(userName)) {
                historyPool.set(userName, []);
            }
            let histChanges = historyPool.get(userName);
            histChanges.push({
                timeStamp: new Date().getTime(),
                changes: changes
            });
            changesPool.delete(userName);
        }
    }
}

class Workbook {
    /**
    * @type {Worksheet[]}
    */
    _sheets;
    /**
     * @type {number}
     */
    _activeSheetIndex;
    _options;
    _modelManager;
    _commandManager;
    _userManager;

    constructor(options, ...args) {
        this._options = { ...options, ...DEFAULT_WORKBOOK_OPTIONS };
        this.init(args);
    }

    init(args) {
        let self = this;
        self.beforeInit?.(...args);
        self._sheets = [];
        self._activeSheetIndex = 0;
        self._commandManager = new CommandManager(self);
        self._modelManager = new ModelManager(self);
        let options = self._options;
        for (let i = 0; i < options.sheetCount; i++) {
            self.addSheet();
        }
        initCommands(self._commandManager);
        self.afterInit?.(...args);
    }

    getSharedModel() {
        return this.modelManager().getSharedModel();;
    }

    /**
     * 
     * @returns {CommandManager}
     */
    commandManager() {
        return this._commandManager;
    }

    /**
     * 
     * @returns {ModelManager}
     */
    modelManager() {
        return this._modelManager;
    }

    /**
     * 
     * @param {string} [name] 
     * @returns 
     */
    addSheet(name) {
        let self = this;
        if (name && this.getSheetByName(name)) return false;

        if (!name) {
            name = this._initSheetName();
        }
        let sheet = this.getNewWorksheet(name);
        self._sheets.push(sheet);
        self.refresh?.();
        return true;
    }

    getNewWorksheet(name) {
        let self = this;
        let modelManager = self.modelManager();
        modelManager.do("addSheet", name);
        let dataModel = modelManager.getSheetModel(name);
        return new Worksheet(self, name, dataModel);
    }

    removeSheet(name) {
        let self = this;
        let index = self._sheets.findIndex(sheet => sheet.name() === name);
        if (index !== -1) {
            let sheet = self._sheets[index];
            sheet.dispose();
            self._sheets.splice(index, 1);
            self._modelManager.do("removeSheet", name);
        }
        self.refresh?.();
    }

    getSheetByName(name) {
        return this._sheets.find(sheet => sheet.name() === name);
    }

    getSheetIndexByName(name) {
        return this._sheets.findIndex(sheet => sheet.name() === name);
    }

    getSheet(index) {
        return this._sheets[index];
    }

    getActiveSheet() {
        return this._sheets[this._activeSheetIndex];
    }

    setActiveSheet(name) {
        let index = this.getSheetIndexByName(name);
        if (index && index > -1) {
            this._activeSheetIndex = index;
            this.refresh();
        }
    }

    _initSheetName() {
        let sheetIndex = 1;
        let sheetPrefix = "Sheet";
        while (this.getSheetByName(sheetPrefix + sheetIndex)) {
            sheetIndex++;
        }
        return sheetPrefix + sheetIndex;
    }

    dispose() {
        this._sheets.forEach(sheet => sheet.dispose());
        this._sheets = null;
        this._options = null;
        this._modelManager = null;
        this._commandManager = null;
        this._userManager = null;
    }

    // //#region hooks
    // beforeInit() {}
    // afterInit() {}
    // refresh() {}
    // //#endregion
}

class Worksheet {

    /**
     * @type {string}
     */
    _name
    /**
     * @type {Workbook}
     */
    _parent;
    /**
     * @type {DataModel}
     */
    _model;

    /**
     * @param {Workbook} parent 
     * @param {string} name
     */
    constructor(parent, name, dataModel) {
        this._name = name;
        this._parent = parent;
        this._model = dataModel || new DataModel();
    }

    getParent() {
        return this._parent;
    }

    name() {
        return this._name;
    }

    /**
     * 
     * @param {number} row 
     * @param {col} col 
     * @param {number | string | null} value 
     * @returns 
     */
    setValue(row, col, value) {
        let self = this;
        if (isNullOrUndefined(value)) {
            value = null;
        }
        if (!(isNaN(parseFloat(value, 10)))) {
            value = parseFloat(value, 10);
        }
        let sharedModel = self._parent.getSharedModel();
        let index = sharedModel.getIndex(value);
        if (index !== self._model.getValue(row, col)) {
            self._model.setValue(row, col, index);
            self.repaint?.();
        }
    }

    /**
     * 
     * @param {number} row 
     * @param {number} col 
     * @returns {number | string | boolean | Date | null} value
     */
    getValue(row, col) {
        let self = this;
        let index = self._model.getValue(row, col);
        if (!isNullOrUndefined(index)) {
            let sharedModel = self._parent.getSharedModel();
            return sharedModel.getValue(index);
        }
        return null;
    }

    _initViewModel() {
        let self = this;
        let model = JSON.parse(self._model.toJSON());
        let sharedModel = self.getParent().getSharedModel();
        for (const rowIndex in model) {
            const row = model[rowIndex];
            for (const colIndex in row) {
                const sharedValuesIndex = row[colIndex];
                row[colIndex] = sharedModel.getValue(sharedValuesIndex);
            }
        }
        return model;
    }
}

/**
 * 
 * @param {Workbook} context 
 * @param {*} options 
 * @returns 
 */
function getWorksheet(context, options) {
    if (context.sheets) {
        let sheet = context.getSheetByName(options.sheetName);
        if (sheet) {
            return sheet;
        }
    }
    return context;
}


const Command_DEF_Edit_Cell = {
    /**
     * 
     * @param {WorkbookRender} context 
     * @param {*} commandOptions 
     * @param {boolean} isUndo 
     */
    execute: function (context, commandOptions, isUndo) {
        let { row, col, newValue, sheetName } = commandOptions;
        let sheet = context.getSheetByName(sheetName);
        if (sheet) {
            if (isNullOrUndefined(newValue)) {
                newValue = null;
            }
            if (!(isNaN(parseFloat(newValue, 10)))) {
                newValue = parseFloat(newValue, 10);
            }
            if (sheet.getValue(row, col) !== newValue) {
                let modelManager = context.modelManager();
                modelManager.do('setValue', sheetName, row, col, newValue);
                sheet.repaint?.();
            }
        }
    }
};

/**
 * 
 * @param {CommandManager} commandManager 
 */
function initCommands(commandManager) {
    commandManager.register('editCell', Command_DEF_Edit_Cell);
};

export { Command, CommandManager, Command_DEF_Edit_Cell, DEFAULT_SHEET_COL_COUNT, DEFAULT_SHEET_ROW_COUNT, DEFAULT_WORKBOOK_OPTIONS, DataModel, ModelManager, SharedModel, USER_PRIORITY, USER_STATUS, Workbook, Worksheet, getWorksheet, initCommands, isNullOrUndefined };
