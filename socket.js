const net = require('net'),
    sock_tls = require('./sg_socket_tls'),
    fs = require('fs');

class Socket {
    constructor(name, ip, port){
        this.ip = ip;
        this.name = name;
        this.port = port;
        this.socket = new net.Socket();
        
        this.session = sock_tls.randInt(10000, 50000);               //генерируем номера сессии

        this.socket.on('data', (data)=>{                //на каждый сокет вешаем обработчик-парсер приходящих сообщений

            if(data[4]==sock_tls.FAC_DATA & data[5]==sock_tls.DATA_GET_DEVICE_STATE) {		//если пришел ответ состояния устройства
                if(data[16]==0x00) {
                    console.log("OK");
                }
                console.log("test: ", (data[17]&0b00000100))
                if(!(data[17]&0b00000001)){
                    console.log("Исправность шины I2C -    Да")
                } else {
                    console.log("Исправность шины I2C -    Нет")
                }
                if(!(data[17]&0b00000100)){
                    console.log("Исправность шины SPI -    Да")
                } else {
                    console.log("Исправность шины SPI -    Нет")
                }
                if(!(data[17]&0b00001000)){
                    console.log("исправность памяти FRAM - Да")
                } else {
                    console.log("исправность памяти FRAM - Нет")
                }
                if(!(data[17]&0b00010000)){
                    console.log("исправность часов RTC - Да")
                } else {
                    console.log("исправность часов RTC - Нет")
                }
                if(!(data[17]&0b00100000)){
                    console.log("исправность памяти Data Flash - Да")
                } else {
                    console.log("исправность памяти Data Flash - Нет")
                }
                if(!(data[17]&0b01000000)){
                    console.log("исправность встроенного источника питания ШС 18 В - Да")
                } else {
                    console.log("исправность встроенного источника питания ШС 18 В - Нет")
                }
                if(data[18]==0x00){
                    console.log("Дежурный режим прибора")
                } else if (data[18]==0x01){
                    console.log("Режим тестирования прибора")
                } else if (data[18==0x02]){
                    console.log("Режим тестирования ШС")
                } else if (data[18]==0x03) {
                    console.log("Форматирование памяти прибора")
                }
                if(data[19]&0b00000001){
                    console.log('Переполнение журнала регистрации - Да');
                } else {
                    console.log('Переполнение журнала регистрации - Нет');
                }
                if(data[19]&0b00000010){
                    console.log('Неисправность прибора - Да');
                } else {
                    console.log('Неисправность прибора - Нет');
                }
                if(data[19]&0b00100000){
                    console.log('Тревога СКУД - Да');
                } else {
                    console.log('Тревога СКУД - Нет');
                }
                if(data[19]&0b01000000){
                    console.log('Тревога ОПС - Да');
                } else {
                    console.log('Тревога ОПС - Нет');
                }
                if(data[19]&0b10000000){
                    console.log('Тихая тревога - Да');
                } else {
                    console.log('Тихая тревога - Нет');
                }
                if(data[20]&0b00000001){
                    console.log('Вскрытие корпуса - Да');
                } else {
                    console.log('Вскрытие корпуса - Нет');
                }
                if(data[15+5]&0b00000001){
                    console.log('Неисправность ИП - Да');
                } else {
                    console.log('Неисправность ИП - Нет');
                }
                if(data[15+14]==0x00){
                    console.log('РКД считывателя 1 - Открыто');
                } else if(data[15+14]==0x01){
                    console.log('РКД считывателя 1 - Контроль');
                } else if(data[15+14]==0x02){
                    console.log('РКД считывателя 1 - Совещание');
                } else if(data[15+14]==0x03){
                    console.log('РКД считывателя 1 - Закрыто');
                } else if(data[15+14]==0x04){
                    console.log('РКД считывателя 1 - Охрана');
                }
                if(data[15+15]==0x00){
                    console.log('РКД считывателя 2 - Открыто');
                } else if(data[15+15]==0x01){
                    console.log('РКД считывателя 2 - Контроль');
                } else if(data[15+15]==0x02){
                    console.log('РКД считывателя 2 - Совещание');
                } else if(data[15+15]==0x03){
                    console.log('РКД считывателя 2 - Закрыто');
                } else if(data[15+15]==0x04){
                    console.log('РКД считывателя 2 - Охрана');
                }
                // if(data[15+58]&0b00000001) {
                //     console.log("Состояние связи с устройствами на RS-485, 1-ый контроллер - связь есть");
                // } else {
                //     console.log("Состояние связи с устройствами на RS-485, 1-ый контроллер - связи нет");
                // }
                // if(data[15+58]&0b00000010) {
                //     console.log("Состояние связи с устройствами на RS-485, 2-ой контроллер - связь есть");
                // } else {
                //     console.log("Состояние связи с устройствами на RS-485, 2-ой контроллер - связи нет");
                // }
                // if(data[15+59]&0b00000001) {
                //     console.log("Состояние неисправности устройств на RS-485, 1-ый контроллер - не исправен");
                // } else {
                //     console.log("Состояние неисправности устройств на RS-485, 1-ый контроллер - исправен");
                // }
                // if(data[15+59]&0b00000010) {
                //     console.log("Состояние неисправности устройств на RS-485, 2-ой контроллер - не исправен");
                // } else {
                //     console.log("Состояние неисправности устройств на RS-485, 2-ой контроллер - исправен");
                // }
                if((data[15+60]&0b00000001)) {
                    console.log('перемычка установлена на IP_MODE');
                } else if ((data[15+60]&0b00000010)) {
                    console.log('перемычка установлена на IP_DEFAULT');
                } else if ((data[15+60]&0b00000100)) {
                    console.log('перемычка установлена на XP3.1');
                } else if ((data[15+60]&0b00001000)) {
                    console.log('перемычка установлена на XP3.2');
                } else if ((data[15+60]&0b00010000)) {
                    console.log('перемычка установлена на XP3.3');
                }
            }

            if(data[4]==sock_tls.FAC_CONFIG & data[5]==sock_tls.CNFG_STARTS_SESSION) {          //если пришел ответ начала сессии
                sock_tls.event.emit("startSession");
            }
            
            if(data[4]==sock_tls.FAC_DATA & data[5]==sock_tls.DATA_SEND_REGISTRY_JOURNAL) {		//если пришел ответ регистра
                sock_tls.event.emit('sendToReg');
                let realSize = data[9] * 256 + data[8];
                console.log("registr");
                sock_tls.parseEvent(data.slice(16), realSize);
                this.sendToReg(data[2], data[3]);
            }

            if(data[4]==sock_tls.FAC_DATA & data[5]==sock_tls.DATA_SEND_MONITORING_JOURNAL) {		//если пришел ответ мониторинга
                let realSize = data[9] * 256 + data[8];
                console.log("monitor");
                sock_tls.parseEvent(data.slice(16), realSize);
                this.sendToMon(data[2], data[3]);
            }

            if(data[4]==sock_tls.FAC_DIAGNOSTIC & data[5]==sock_tls.DGN_READ_CONFIG) {  //ответ конфиг
                if(data[18]==sock_tls.SOFTWARE_VERSION){
                    console.log("Номер прошивки: ", data[22], data[21], data[20],data[19])
                } else if(data[18]==sock_tls.DOC_COUNT){
                    if(data[16]!==0x00) {
                        console.log("Ошибка чтения списка карт!")
                    }
                    console.log("Кол-во карт загруженных в турникет: ", parseInt(data[20].toString(16) + data[19].toString(16),16))
                } else if(data[18]==sock_tls.FACTORY_SETTINGS) {
                    console.log("Заводской IP адрес: ", parseInt(data[19].toString(16),16) + '.' +  parseInt(data[20].toString(16),16) + '.' + parseInt(data[21].toString(16),16) + '.' + parseInt(data[22].toString(16),16))
                } else if(data[18]==sock_tls.USER_SETTINGS) {
                    console.log("Текущий IP адрес: ", parseInt(data[19].toString(16),16) + '.' +  parseInt(data[20].toString(16),16) + '.' + parseInt(data[21].toString(16),16) + '.' + parseInt(data[22].toString(16),16))
                } else if(data[18]==sock_tls.DOC_LIST) {		//если получен ответ списка карт
                    //console.log(data)
                    let realSize = data[9] * 256 + data[8],
                        docList = [];
                    if(realSize<=3) {
                        sock_tls.event.emit('getDocList', 0);
                        return;
                    }
                    let ok = data[16 + 0], //OK или ошибка
                        dev = data[16 + 1], //Номер ресурса
                        code = data[16 + 2] //тип ресурса
        
                    let cntDoc=0;
        
                    for(let p=3;p<realSize;p+=16){
                        cntDoc++;
                        let docNum = data.slice(16+p,24+p);
                        let doc = 0;
                        for(let nn = 0; nn<8; nn++) {
                            doc += docNum[nn] * Math.pow(256, nn);
                        }
                        docList.push(doc);
                    }
        
                    sock_tls.event.emit("getDocList", 1, docList);
                    
                } 
            }
            if(data[4]==sock_tls.FAC_CONFIG & data[5]==sock_tls.CNFG_LOAD_IDENTIFIERS) {  //ответ конфиг
                sock_tls.event.emit('docUpload')
            }
            if(data[4]==sock_tls.FAC_SERVICE & data[5]==sock_tls.SVC_KEEP_ALIVE){
                sock_tls.event.emit('keepAlive')
            }
            if(data[4]==sock_tls.FAC_CONTROL & data[5]==sock_tls.CTRL_DATETIME) {
            	if(data[16]==0x00) {
            		console.log("Datetime set!");
            	}
            }
            if(data[4]==sock_tls.FAC_CONTROL & data[5]==sock_tls.CTRL_ACCESS_CONTROL_MODE){
                if(data[16]==0x00) {
                    console.log("Режим доступа установлен");
                }
                if(data[16]==0x03) {
                    console.log("Неверный параметр команды");
                }
            }
        });
    }

    write(req) {
        this.socket.write(req, "ascii");
    }

    connect() {
        this.socket.connect(this.port, this.ip);
    }

    async handShake()  {                                  //поздороваться с устройством
        let sd = new Date();
        let isCrypt = false;
        let key = (isCrypt) ? sock_tls.genCryptKey() : '';
        let req = sock_tls.getCmdConnect(this.session, key, sd)
        try {
            this.socket.write(req, 'ascii')
        } catch(e){
            console.log(e)
        }
    }

    sendToMon(sesHi, sesLo) {
        let req = sock_tls.sendToMon(sesHi, sesLo)
        // console.log("send: ", this.hexEncode(req));
        this.socket.write(req, 'ascii');        
    }

    sendToReg(sesHi, sesLo) {
        let req = sock_tls.sendToReg(sesHi, sesLo);
        // console.log("send: ", this.hexEncode(req));
        this.socket.write(req, 'ascii');
    }

    eventKeepAlive() {
        return new Promise((resolve, reject)=>{
            sock_tls.event.once('keepAlive', ()=>{
                resolve()
            })
        })
    }
    
    hexEncode(str) {
        var hex, i;
        var result = "";
        for (i=0; i<str.length; i++) {
            hex = str.charCodeAt(i).toString(16);
            result += " " +(hex).slice(-4);
        }
        return result
    }

    timeout(ms) {return new Promise(resolve=> {setTimeout(()=>{resolve()}, ms)})}
}

module.exports = Socket