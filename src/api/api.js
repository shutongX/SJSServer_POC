import { DEFAULT_WORKBOOK_OPTIONS } from '../common/defaults';
import { isNullOrUndefined } from '../common/util';
// import { isNullOrUndefined } from '../common/enum';
import { DataModel } from '../common/model';
import { CommandManager, ModelManager } from '../core/core';

export class Workbook {
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

export class Worksheet {

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
export function getWorksheet(context, options) {
    if (context.sheets) {
        let sheet = context.getSheetByName(options.sheetName);
        if (sheet) {
            return sheet;
        }
    }
    return context;
}


export const Command_DEF_Edit_Cell = {
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
            let oldValue = sheet.getValue(row, col);
            if (oldValue !== newValue) {
                let modelManager = context.modelManager();
                modelManager.do('setValue', sheetName, row, col, newValue, oldValue);
                sheet.repaint?.();
            }
        }
    }
}

/**
 * 
 * @param {CommandManager} commandManager 
 */
export function initCommands(commandManager) {
    commandManager.register('editCell', Command_DEF_Edit_Cell);
};