import {Workbook, Worksheet} from '../api/api';
export class WorkbookRender extends Workbook {
    _layoutSuspended;

    /**
     * @param {HTMLElement | string} host 
     */
    constructor(host, options) {
        if (typeof host === "string") {
            host = document.getElementById(host);
        }
        super(options, host);
    }

    beforeInit(...args) {
        let host = args[0];
        this._host = host;
        this.suspendPaint();
    }

    afterInit(...args) {
        this.resumePaint();
    }

    getHost() {
        return this._host;
    }

    suspendPaint() {
        if (this._layoutSuspended === undefined) {
            this._layoutSuspended = 0;
        }
        this._layoutSuspended++;
    }

    resumePaint() {
        this._layoutSuspended--;
        if (this._layoutSuspended <= 0) {
            this._layoutSuspended = 0;
            this.refresh();
        }
    }

    getNewWorksheet(name) {
        let self = this;
        let modelManager = self.modelManager();
        modelManager.do("addSheet", name);
        let dataModel = modelManager.getSheetModel(name);
        return new WorksheetRender(self, name, dataModel);
    }

    /**
     * @returns {WorksheetRender}
     */
    getActiveSheet() {
        return super.getActiveSheet();;
    }

    refresh() {
        if (this._layoutSuspended <= 0) {
            let sheet = this.getActiveSheet();
            sheet.repaint();
        }
    }
}

export class WorksheetRender extends Worksheet {

    _activeRowIndex;
    _activeColIndex;
    _viewModel;
    _editing;

    /**
     * @param {Workbook} parent 
     * @param {string} name 
     */
    constructor(parent, name) {
        super(parent, name);
        this._activeRowIndex = 0;
        this._activeColIndex = 0;
    }

    getValue(row, col) {
        if (this._viewModel?.[row]?.[col] !== undefined) {
            return this._viewModel[row][col];
        }
        return super.getValue(row, col);
    }

    getViewModel () {
        if (!this._viewModel) {
            this._viewModel = this._initViewModel();
        }
        return this._viewModel;
    }

    setViewModel(vm) {
        this._viewModel = vm;
        this.repaint();
    }

    repaint() {
        let self = this;
        let spread = self.getParent();
        /**
         * @type {HTMLElement}
         */
        let host = spread.getHost();
        host.innerHTML = '';

        let vm = self.getViewModel();

        let model = self._model;
        let rowCount = model.getRowCount(), colCount = model.getColCount();
        const table = document.createElement('table');
        let width = ~~(document.body.clientWidth / colCount);
        for (let i = 0; i < rowCount; i++) {
            const row = table.insertRow();
            const rowInfo = vm[i];
            for (let j = 0; j < colCount; j++) {
                const cell = row.insertCell();
                cell.setAttribute('contenteditable', true);
                cell.setAttribute('row', i);
                cell.setAttribute('col', j);
                cell.style.width = width + 'px';
                cell.style.height = '14px';
                cell.textContent = rowInfo?.[j] || '';
            }
        }
        host.appendChild(table);
        self._activateCell(self._activeRowIndex, self._activeColIndex);
        table.addEventListener('keydown', e => {
            let target = e.target, key = e.key;
            let rowIndex = +target.getAttribute('row');
            let colIndex = +target.getAttribute('col');
            self.setActiveCell(rowIndex, colIndex);
            if (key === 'Enter') {
                e.preventDefault();
                if (!self._editing) {
                    self._editing = true;
                    spread.commandManager().execute({
                        cmd: 'editCell',
                        row: rowIndex,
                        col: colIndex,
                        newValue: target.innerText,
                        sheetName: self.name()
                    });
                    self.setActiveCell(rowIndex + 1, colIndex, true);
                }
            } else if (key === 'left') {

            }
        });

        // const tds = document.querySelectorAll('td');
        // tds.forEach(td => {
        //     td.addEventListener('blur', e => {
        //         if (!self._editing) {
        //             let target = e.target;
        //             let rowIndex = +target.getAttribute('row');
        //             let colIndex = +target.getAttribute('col');
        //             spread.commandManager().execute({
        //                 cmd: 'editCell',
        //                 row: rowIndex,
        //                 col: colIndex,
        //                 newValue: target.innerText,
        //                 sheetName: self.name()
        //             });
        //             target.blur();
        //         }
        //     });
        // });
    }

    getRowCount() {
        return this._model.getRowCount();
    }

    getColCount() {
        return this._model.getColCount();
    }

    _getCellDiv(row, col) {
        const table = document.querySelector('table');
        return table.rows[row].cells[col];
    }

    setActiveCell(row, col, focus) {
        let self = this;
        if (row <= self.getRowCount() && col <= self.getColCount() && (row !== self._activeRowIndex || col !== self._activeColIndex)) {
            self._activeRowIndex = row;
            self._activeColIndex = col;
            if (focus) {
                self._activateCell(row, col);
            }
        }
    }

    _activateCell(row, col) {
        this._getCellDiv(row, col).focus();
    }
}