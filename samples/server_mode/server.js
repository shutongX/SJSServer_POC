const express = require('express');
const cors = require('cors');
const socket_io = require('socket.io');
const bodyParser = require('body-parser');

const PORT = 3000;
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
    console.log('客户端连接上了服务器')
})

app.use(cors());
app.use(bodyParser.json());

// 处理获取viewModel请求
app.get('/getViewModel', (req, res) => {
    const viewModel = spread.getActiveSheet()._initViewModel();
    res.send(JSON.stringify(viewModel));
});

// 执行命令
app.post('/execute', (req, res) => {
    const commandOptions = req.body;
    console.log('execute', commandOptions);
    spread.commandManager().execute(commandOptions);
    io.emit('update');
    res.send("朕知道了");
});

// 监听3000端口
server.listen(PORT, () => {
    console.log('Backend Server running on port 3000');
});
