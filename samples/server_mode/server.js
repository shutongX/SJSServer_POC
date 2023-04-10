const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const spread = require('./public/backend');

const PORT_A = 3000, PORT_B = 3001;

// 创建处理render的Express实例
const appRender = express();

// 设置视图引擎和视图文件目录
appRender.set('views', path.join(__dirname, 'views'));
appRender.set('view engine', 'ejs');

appRender.use(express.static(path.join(__dirname, '../../dist')));
appRender.use(express.static(path.join(__dirname, 'public')));
// 获取viewModel
appRender.use((req, res, next) => {
    http.get(`http://localhost:${PORT_B}/getViewModel`, (viewModelRes) => {
        let data = '';
        viewModelRes.on('data', (chunk) => {
            data += chunk;
        });
        viewModelRes.on('end', () => {
            res.viewModel = JSON.parse(data);
            next();
        });
    }).on('error', (err) => {
        console.log(`Error: ${err.message}`);
        next();
    });
});

// 路由处理
appRender.get('/', (req, res) => {
    res.render('index', { viewModel: res.viewModel });
});
// 监听3000端口
appRender.listen(PORT_A, () => {
    console.log('Render Server running on port 3000');
});

// 创建处理viewModel的Express实例
const appBackend = express();
appBackend.use(cors());
appBackend.use(bodyParser.json());

// 处理获取viewModel请求
appBackend.get('/getViewModel', (req, res) => {
    const viewModel = spread.getActiveSheet()._initViewModel();
    res.send(JSON.stringify(viewModel));
});

// 执行命令
appBackend.post('/execute', (req, res) => {
    const commandOptions = req.body;
    console.log('execute', commandOptions);
    spread.commandManager().execute(commandOptions);
    res.send({ status: 'success', message: 'Command executed successfully' });
});

// 监听3001端口
appBackend.listen(PORT_B, () => {
    console.log('Backend Server running on port 3001');
});
