const App = require('./app');

process.on('message', m => {
    let app = new App.App(m.ip, m.direction);
})

