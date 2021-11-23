const Socket = require('./socket'),
    sock_tls = require('./sg_socket_tls'),
    fs = require('fs'),
    mysql = require('mysql'),
    config = require('./config');
let con = mysql.createConnection(config.mysql);


class Device {
    constructor(ip) {
        this.ip = ip;
        this.config =  new Socket("config", this.ip, 18902);
        this.monitor = new Socket("monitor", this.ip, 18906);
        this.registr = new Socket("registr", this.ip, 18903);
        this.verify = new Socket("verify", this.ip, 18905);
        this.indicate = new Socket("indicate", this.ip, 18904);
        this.flagDocUpload = false;

     
        this.configActive = false;
        this.monitorActive = false;
        this.registrActive = false;

        this.config.socket.on('connect', ()=>{
            console.log("connected to 18902 on ", this.ip);
        })

        this.monitor.socket.on('connect', ()=>{
            console.log("connected to 18906 on ", this.ip);
        })

        this.registr.socket.on('connect', ()=>{
            console.log("connected to 18903 on ", this.ip);
        })

        this.verify.socket.on('connect', ()=>{
            console.log("connected to 18905 on ", this.ip);
        })

        this.indicate.socket.on('connect', ()=>{
            console.log("connected to 18904 on ", this.ip);
        })

        this.config.socket.on('error', (err)=>{
            console.log(err, "18902");
        })

        this.monitor.socket.on('error', (err)=>{
            console.log(err, "18903");
        })

        this.registr.socket.on('error', (err)=>{
            console.log(err, "18903");
        })

        this.verify.socket.on('error', (err)=>{
            console.log(err, "18905");
        })

        this.indicate.socket.on('error', (err)=>{
            console.log(err, "18904");
        })

        this.config.socket.on('close', ()=>{
            this.configActive = false;
            console.log("18902 is closed");
        });

        this.monitor.socket.on('close', ()=>{
            this.monitorActive = false;
            console.log("18906 is closed");
        });

        this.verify.socket.on('close', ()=>{
            this.monitorActive = false;
            console.log("18905 is closed"); 
        });

        this.registr.socket.on('close', ()=>{
            this.registrActive = false;
            console.log("18903 is closed");
        });
        
        this.config.socket.setTimeout(65000);

        this.config.socket.on('timeout', ()=> {
            console.log('timeout')
            if(this.configActive) this.config.socket.destroy();
            if(this.monitorActive) this.monitor.socket.destroy();
            if(this.registrActive) this.registr.socket.destroy();
            
        })

        this.config.connect();

        this.config.socket.on('connect', ()=>{
            this.configActive = true;
            this.config.handShake();
        });
        
        sock_tls.event.on('startSession', ()=>{
            console.log("Session started!");
            this.monitor.connect();
        })
        
        this.monitor.socket.on('connect', ()=> {
            this.monitorActive = true;
            this.registr.connect();
        })

        this.registr.socket.on('connect', ()=> {
            this.registrActive = true;
            sock_tls.event.emit('run');
        })

        setInterval(()=>{
            // console.log('setInterval', this.configActive, this.monitorActive, this.registrActive);

            if(!this.configActive) {
                if(this.monitorActive) this.monitor.socket.destroy();   //если отключен конфиг и включен монитор то отключить монитор
                if(this.registrActive) this.registr.socket.destroy();   //если отключен конфиг и включен регистр то отключить регистр

                if(!this.monitorActive && !this.registrActive) {        //если все сокеты отключены то включить все
                    this.config.connect();
                    this.config.socket.setTimeout(65000);
                }
            }
            if(this.configActive) {
                if(!this.monitorActive) {
                    this.monitor.connect();
                }
                if(!this.registrActive) {
                    this.registr.connect();
                }
            }
        }, 30000)

        // sock_tls.event.on('sendToMon', (idses)=>{
        //     // console.log('номер сессии для мониторинга', this.config.session);
        //     let req = sock_tls.sendToMon(this.config.session);
        //     console.log("send to mon: ", this.hexEncode(req));
        //     this.monitor.socket.write(req, 'ascii');
        // })
    
        // sock_tls.event.on('sendToReg', (idses)=>{
        //     // console.log('номер сессии для регистра', this.config.session);
        //     let req = sock_tls.sendToReg(this.config.session);
        //     console.log("send to reg: ", this.hexEncode(req));
        //     this.registr.socket.write(req, 'ascii');
        // })
    }

    setDataTime() {
        let req = sock_tls.setDataTime(this.config.session);
        this.config.write(req);
    }

    
    // keepAlive() {
    //     let wait = setTimeout(()=>{     //таймаут если связь с устройством прервана
    //         clearTimeout(wait)
    //         console.log("устройство " + this.ip + " не отвечает!")
    //         //sock_tls.event.emit('restartKeepAlive');
    //     }, 61000);
    //     sock_tls.event.once('keepAlive', ()=>{
    //         clearTimeout(wait)
    //         this.keepAlive();
    //     })
    // }

    regVerify() {
        let req = sock_tls.regVerify();
        try{
            this.verify.write(req)
            console.log("req: ", this.hexEncode(req));
        } catch(e){
            console.log(e)
        }
    }


    getDeviceState() {
        let req = sock_tls.getDeviceState(this.config.session);
        try{
            this.config.write(req)
        } catch(e){
            console.log(e)
        }
    }

    getDocCount() {                                 //получить кол-во карт с каждого устройства
        (async ()=>{
            let req = sock_tls.getCmdReadConfig(this.config.session, sock_tls.DOC_COUNT, 0x01);

            try {
                this.config.write(req)

            } catch(e){
                console.log(e)
            }
        })()
    }

    async downloadDoc() {                   //получить список карт
        sock_tls.docList = []
        console.log("get doc list")
        let i = 0,
            docList = [];
        while(1){
            i++;
            let req = sock_tls.getCmdReadConfig(this.config.session, sock_tls.DOC_LIST, 1, i);
            try {
                this.config.write(req);
            } catch(e){
                console.log(e);
            }
            let wait = setTimeout(()=>{     //таймаут если связь прервана
                clearTimeout(wait);
                console.log("timeout");
                return
            }, 2000);

            try{
                let arr = await this.eventGetDocList(); //еще есть карты в пакете
                docList.push(...arr);
                // console.log("pack: ", arr)
            } catch(e){         //если кол-во карт в пакете нет то сохраняем все карты
                console.log("Все карты выгружены из устройства!");
                console.log(docList);
                clearTimeout(wait)
                return
            }
            clearTimeout(wait)
        }
        // console.log("send: ", this.hexEncode(req))
    }

    async uploadDoc() {              //выгрузка карт в устройство
        this.flagDocUpload = true;	//установка true для запрета параллельной загрузки карт

            // let doc = [1059557,2119146,3269705, 1111111, 222222, 333333, 4444444, 5555555, 6666666, 7777777, 888888, 9999999, 4564654,47878978,66545641,102545655,7897945,1569763]
        // let con = mysql.createConnection({
        //     host: "localhost",
        //     user: "jtag",
        //     password: "9889",
        //     database: "elib",
        //     insecureAuth: true
        // });

        // await this.sqlConnection(con);
        // let result;
        // try {
        //     result = await this.sqlQuery(con, "SELECT codUdTurniketa FROM card WHERE codUdTurniketa <> ''");
        // } catch(e) {
        //     console.log(e);
        // }

        let arr = [];

        let result = (await this.sqlQuery("SELECT number FROM card WHERE actuality='1'"));
        for(let i = 0; i<result.length; i++){
          arr.push(result[i]['number']);
        }

        arr = this.getUnique(arr);                      //удаление дублирующих чисел
        arr.sort(function(a,b){return a-b})             //сортировка
        for(let i = 0; i < arr.length; i++) {           //парсер из строки в числа
            arr[i] = +arr[i];
        }

        let al16 = '10021002000563fe';
        let docLev = this.hex2bin(al16);
                                
        let cntrow = arr.length;                //кол-во карт для загрузки
        let cntBat = Math.ceil(cntrow/16);      //вычисляем кол-во запросов для загрузки всех карт 
        for(let b = 0; b < cntBat; b++) {
            //кол-во в пакете
            let dc = 0;
            if(b==(cntBat-1)){
                dc = (cntrow % 16) ? (cntrow % 16) : 16;    //вычисляем кол-во карт в данном запросе
            } else {
                dc = (cntrow<=16) ? cntrow : 16;
            }
            let be = 0;		//признак пакет первый или последний
            if(b==0){
                be = be | 0x01;
            }
            if(b==cntBat - 1) {
                be = be | 0x02;
            }
            let data = sock_tls.chr(1); //номер ИУ
            data += sock_tls.chr(be); //признак пакет первый или последний

            for(let d = 0; d < dc; d++){
                let d1 = arr[b * 16 + d]			//взятие карты из массива карт
                data += sock_tls.getDocData(d1);    //запись карты в 16 сс
                data += docLev;
            }

            let req = sock_tls.getCmdDocLoad(this.config.session, data);     //составление запроса
            try{
                this.config.write(req)
            } catch(e){
                console.log(e)
            }
            let wait = setTimeout(()=>{     //таймаут если связь прервана
                clearTimeout(wait)
                console.log("Соединение прервано!")
                return
            }, 10000)
            try {
                await this.eventDocUpload()         //ожидание обработчика ответа
            } catch(e) {
                clearTimeout(wait)
                return;
            }
            clearTimeout(wait)
        }
        this.flagDocUpload = false;
        console.log("Все карты загружены в устройство!")
        return
    }


    eventAnswerMon() {
        return new Promise((resolve, reject)=>{
            sock_tls.event.once('sendToMonitor', ()=>{
                resolve();
            })
        })
    }

    eventDocUpload() {
        return new Promise((resolve, reject)=>{
            sock_tls.event.once('docUpload', ()=>{
                resolve()
            })
        })
    }

    
    getVersion(idses) {
        console.log("getVersion")
        let req = getCmdReadConfig(idses, SOFTWARE_VERSION, 0x00)
        
        try {
            config.write(req, 'ascii');
        } catch(e){
            console.log(e)
        }
    }

    factorySettings(idses, num) {  //получить заводские настройки
        console.log("factory settings")
        let req = getCmdReadConfig(idses, FACTORY_SETTINGS, num);
        try {
            config.write(req, 'ascii');
        } catch(e){
            console.log(e)
        }
    }

    userSettings(idses, num) {		//получить пользовательские настройки
        console.log("user settings")
        let req = getCmdReadConfig(idses, USER_SETTINGS, num);
        try {
            config.write(req, 'ascii');
        } catch(e){
            console.log(e)
        }
    }

    setAccessMode(numReader, mode) {
        let req = sock_tls.setAccessMode(this.config.session, numReader, mode);
        try{
            this.config.write(req)
        } catch(e){
            console.log(e)
        }
    }

    eventSocket() {
        this.config.socket.on('data', (data)=>{
            console.log("getDocCount: ", data);
        })
    }

    eventGetDocList(){
        return new Promise((resolve, reject)=>{
            sock_tls.event.once('getDocList', (a, docList = 0)=>{
                if(a==1) {
                    resolve(docList)
                } else if (a==0){
                    reject();
                }
            })
        })
    }

    hex2bin(s) {
        var ret = []
        var i = 0
        var l
        s += ''
        for (l = s.length; i < l; i += 2) {
          var c = parseInt(s.substr(i, 1), 16)
          var k = parseInt(s.substr(i + 1, 1), 16)
          if (isNaN(c) || isNaN(k)) return false
          ret.push((c << 4) | k)
        }
        return String.fromCharCode.apply(String, ret)
    }

    getUnique(arr) {
        var i = 0,
        current,
        length = arr.length,
        unique = [];
        for (; i < length; i++) {
          current = arr[i];
          if (!~unique.indexOf(current)) {
            unique.push(current);
          }
        }
        return unique;
    };

   
    hexEncode(str) {
        var hex, i;
        var result = "";
        for (i=0; i<str.length; i++) {
            hex = str.charCodeAt(i).toString(16);
            result += " " +(hex).slice(-4);
        }
        return result
    }

    sqlQuery(query) {
        return new Promise(function (resolve, reject) {
            con.query(query, function (err, result) {
                if (err) reject(err);
                resolve(result);
            })
        })
    }

    timeout(ms) {return new Promise(resolve=> {setTimeout(()=>{resolve()}, ms)})}
}

module.exports = Device