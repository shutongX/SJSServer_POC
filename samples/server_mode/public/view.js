GC.CommandManager.prototype.execute = function (commandOptions) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(commandOptions)
    };
    fetch('http://localhost:3001/execute', options)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                refresh();
            }
        })
        .catch(error => console.error(error));
}


spread = new GC.WorkbookRender('ss')
sheet = spread.getActiveSheet();

async function refresh() {
    fetch('http://localhost:3001/getViewModel').then(response => response.json())
    .then(data => {
        sheet.setViewModel(data);
        sheet._editing = false;
    })
}