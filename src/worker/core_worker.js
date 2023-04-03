importScripts('../api/api.js');
importScripts('../common/defaults.js');
importScripts('../common/enum.js');
importScripts('../common/model.js');
importScripts('../common/util.js');
importScripts('../core/core.js');

let ss = new Workbook();

self.addEventListener("message", function (message) {
    let data = message.data;
    let v = null;
    if (data.api) {
        let sheet = ss.getActiveSheet();
        v = sheet[data.api].apply(sheet, data.args);
        self.postMessage({ type: 'api', req: data, rep: v });
        return;
    }

    let sheet = data.sheet ? ss.getSheetByName(data.sheet) : ss.getActiveSheet();

    switch (data.cmd) {
        case 'start':
            self.postMessage('WORKER STARTED: ' + data.msg);
            break;
        case 'stop':
            self.postMessage('WORKER STOPPED: ' + data.msg +
                '. (buttons will no longer work)');
            self.close(); // Terminates the worker.
            break;
        case 'viewModel':
            refresh(sheet);
            break;
        case 'cmd':
            try {
                ss.commandManager().execute(data.options);
                refresh(sheet)
            } catch (e) {
                console.log(e);
            }
            break;
    };
});

function refresh(sheet) {
    if (sheet) {
        self.postMessage({ type: 'viewModel', data: {
            sheetName: sheet.name(),
            model: sheet._initViewModel(),
        } });
    }
}