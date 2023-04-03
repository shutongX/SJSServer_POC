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
    /**
     * @type {SharedModel}
     */
    _sharedModel;
    /**
     * @type {Manager}
     */
    _manager;

    constructor(options, ...args) {
        this._options = { ...options, ...DEFAULT_WORKBOOK_OPTIONS };
        this.init(args);
    }

    init(args) {
        let self = this;
        self.beforeInit(...args);
        this._sheets = [];
        this._activeSheetIndex = 0;
        let options = self._options;
        for (let i = 0; i < options.sheetCount; i++) {
            self.addSheet();
        }
        this._sharedModel = new SharedModel();
        this._manager = new Manager(this);
        self.afterInit(...args);
    }

    getSharedModel() {
        return this._sharedModel;
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
        self.refresh();
        return true;
    }

    getNewWorksheet(name) {
        return new Worksheet(self, name);
    }

    deleteSheet(name) {
        let self = this;
        let index = self._sheets.findIndex(sheet => sheet.name === name);
        if (index !== -1) {
            let sheet = self._sheets[index];
            sheet.dispose();
            self._sheets.splice(index, 1);
        }
        self.refresh();
    }

    getSheetByName(name) {
        return this._sheets.find(sheet => sheet.name === name);
    }

    getSheetIndexByName(name) {
        return this._sheets.findIndex(sheet => sheet.name === name);
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
    }

    // //#region hooks
    // beforeInit() {}
    // afterInit() {}
    // refresh() {}
    // //#endregion
}

class Worksheet {

    _name
    _parent;
    _model;
    _sharedModel;

    /**
     * @param {Workbook} parent 
     * @param {string} name
     */
    constructor(parent, name) {
        this._name = name;
        this._parent = parent;
        this._model = new DataModel();
        this._sharedModel = parent.getSharedModel();
    }

    getParent() {
        return this._parent;
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
            self.repaint();
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

const SET_VALUE_COMMAND = {
    /**
    * 
    * @param {Workbook} context 
    * @param {*} options 
    * @returns {boolean}
    */
    execute: (context, options) => {
        let sheet = getWorksheet(context, options);
        context._manager.
         sheet.setValue(options.row, options.col, options.value);
        return true;
    }
}

/**
 * @param {CommandManager} commandManager 
 */
function initCommands(commandManager) {
    commandManager.register("setValue",)
}