Workbook.prototype.postMessage = function (args) {
    this.worker.postMessage(args);
}

Workbook.prototype.processMessage = function (message) {
    let {type, data} = message.data;
    switch (type) {
        case 'viewModel': 
            let sheetName = data.sheetName;
            let sheet = this.getSheetByName(sheetName);
            if (sheet) {
                sheet.setViewModel(data.model);
                sheet._editing = false;
            }
            break;
    }
}

Workbook.prototype.startWorker = function () {
    if (typeof (Worker) !== "undefined") {
        if (typeof (worker) == "undefined") {
            this.worker = new Worker("../../src/worker/core_worker.js");
            console.log('worker started......');
        }
        let processMessage = this.processMessage.bind(this);
        this.worker.onmessage = processMessage;
    } else {
        console.log("Sorry! No Web Worker support.");
    }
}

Workbook.prototype.stopWorker = function() {
    this.worker.terminate();
    this.worker = null;
}

Workbook.prototype.dispose = function() {
    this.stopWorker();
    this._sheets.forEach(sheet => sheet.dispose());
    this._sheets = null;
    this._options = null;
    this._modelManager = null;
    this._commandManager = null;
    this._userManager = null;
}

CommandManager.prototype.execute = function (commandOptions) {
    this._context.postMessage({ options: commandOptions, cmd: 'cmd'});
}