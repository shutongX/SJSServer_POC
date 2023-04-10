import { DataModel, SharedModel } from '../common/model';
import { DEFAULT_SHEET_ROW_COUNT, DEFAULT_SHEET_COL_COUNT } from '../common/defaults';

export class Command {
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

export class CommandManager {
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

export class ModelManager {

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