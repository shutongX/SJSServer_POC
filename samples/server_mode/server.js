const express = require('express');
const cors = require('cors');
const socket_io = require('socket.io');
const bodyParser = require('body-parser');

const spread = require('./public/backend');

// 创建处理viewModel的Express实例
const app = express();
const server = require('http').createServer(app);
const io = socket_io(server, {
    cors: {
        origin: '*',  // 允许来自所有来源的请求
        credentials: true  // 允许包含凭据的跨域请求
    }
});

io.on('connection', function (socket) {
    const clientIpAddress = socket.request.connection.remoteAddress;
    console.log(`客户 ${USER_NAMES[clientIpAddress] || clientIpAddress} 连接上了服务器`)
})

app.use(cors());
app.use(bodyParser.json());

// 处理获取viewModel请求
app.get('/getViewModel', (req, res) => {
    const viewModel = spread.getActiveSheet()._initViewModel();
    res.send(JSON.stringify(viewModel));
});

const USER_NAMES = {}

const CHANGE_LIST = [];

app.get('/getChangeList', (req, res) => {
    res.send(JSON.stringify(CHANGE_LIST));
});

app.get('/getUserName', (req, res) => {
    let userName = USER_NAMES[req.ip] || req.ip;
    if (userName) {
        res.send(JSON.stringify(userName));
    }
});

app.post('/register', (req, res) => {
    const clientIpAddress = req.ip;
    const userName = req.body.userName;
    if (userName) {
        USER_NAMES[clientIpAddress] = userName;
        CHANGE_LIST.forEach((change) => {
            if (change.userIP === clientIpAddress) {
                change.userName = userName;
            }
        });
        io.emit('change', {
            changeList: CHANGE_LIST
        });
        res.send("朕知道了");
    }
});



// 执行命令
app.post('/execute', (req, res) => {
    const clientIpAddress = req.ip;
    const commandOptions = req.body;
    console.log('execute', commandOptions);
    spread.commandManager().execute(commandOptions);
    CHANGE_LIST.push({
        userIP: clientIpAddress,
        userName: USER_NAMES[clientIpAddress] || clientIpAddress,
        commandOptions: commandOptions
    })
    io.emit('change', {
        changeList: CHANGE_LIST,
        viewModel: spread.getActiveSheet()._initViewModel()
    });
    res.send("朕知道了");
});

app.post('/undo', (req, res) => {
    const clientIpAddress = req.ip;
    for (let i = CHANGE_LIST.length - 1; i >= 0; i--) {
        let change = CHANGE_LIST[i];
        if (change.userIP === clientIpAddress) {
            let lastCommand = change.commandOptions;
            let {newValue, oldValue} = lastCommand;
            lastCommand.newValue = oldValue;
            lastCommand.oldValue = newValue;
            spread.commandManager().execute(lastCommand);
            console.log('undo', lastCommand);
            CHANGE_LIST.splice(i, 1);
            break;
        }
    }
    io.emit('change', {
        changeList: CHANGE_LIST,
        viewModel: spread.getActiveSheet()._initViewModel()
    });
    res.send("朕知道了");
});

// 监听3000端口
const HOST = '10.32.1.21', PORT = 3000;
server.listen(PORT, HOST, () => {
    console.log(`Backend Server running on http://${HOST}:${PORT}`)
});
