class Manager {
    _historyPool;
    _changesPool;

    _userModel;
    _dataModels;
    _commandManager;

    _spread;

    constructor(spread) {
        this._historyPool = new Map();
        this._changesPool = new Map();
        this._dataModel = {};
        this._userModel = new UserModel();
        this._commandManager = new CommandManager(spread);
        this._spread = spread;
    }

    do(methodName, ...methodArgs) {
        let self = this;
        if (methodName) {
            let method = self[methodName];
            method && method.apply(self, methodArgs);
        }
    }

    undo(userName) {
        this._commandManager.undo(userName);
    }

    redo(userName) {
        this._commandManager.redo(userName);
    }

    setValue(row, col, value) {
        this._dataModel.setValue(row, col, value);
    }

    getValue(row, col) {
        return this._dataModel.getValue(row, col);
    }

    startTransaction(userName) {
        if (!userName) return;
        let changesPool = this._changesPool;
        if (!changesPool.has(userName)) {
            changesPool.set(userName, []);
        }
    }

    endTransaction(userName) {
        if (!userName || !this._changesPool.has(userName)) return;
        let changesPool = this._changesPool;
        let historyPool = this._historyPool;
        let changes = this._changesPool.get(userName);
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

    redo() {

    }

    dispose() {
        this._context = null;
    }

}