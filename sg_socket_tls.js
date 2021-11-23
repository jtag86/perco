const EventEmitter = require('events').EventEmitter;
let event = new EventEmitter;

const SIG_CALL = 0x00F1,
	SIG_RETURN = 0x00F2,

	FAC_CONFIG = 0x01,
	FAC_CONTROL = 0x02,
	FAC_DATA = 0x04,
	FAC_DIAGNOSTIC = 0x05,
	FAC_SERVICE = 0x08,
	FAC_DEBUG = 0x09,

	REQUEST_CONFIG = 0x01,
	CHANGE_CONFIG = 0x02,
		
	CNFG_STARTS_SESSION = 0x80,	// FAC_CONFIG
	CNFG_LOAD_IDENTIFIERS = 0x0E,
	CNFG_ADD_IDENTIFIERS = 0x0F,
	CNFG_DEL_IDENTIFIERS = 0x10,

	CTRL_ACCESS_CONTROL_MODE = 0x01, //FAC_CONTROL
	CTRL_DATETIME = 0x04,		

	DATA_SEND_REGISTRY_JOURNAL = 0x01, 	//FAC_DATA
	DATA_SEND_MONITORING_JOURNAL = 0x02,
	DATA_GET_DEVICE_STATE = 0x03,

	FACTORY_SETTINGS = 0x01,
	USER_SETTINGS = 0x02,
	DGN_READ_CONFIG = 0x03, // FAC_DIAGNOSTIC 
	DOC_COUNT = 0x14,
	DOC_LIST = 0x15,
	SOFTWARE_VERSION = 0x20,
	CALENDAR = 0x0F,

	ID_CONTROL = 0x07,
	IDCTRL_REGISTRY_IDENTIFY = 0x03,

	SVC_KEEP_ALIVE = 0x01, //SERVICE

	DEBUG_DATA_SEND_MSG = 0x01; //DEBUG

let docList = [];

String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}

function hex2bin(hex){
    return ("00000000" + (parseInt(hex, 16)).toString(2)).substr(-8);
}

function parseEvent(buff, realSize) {             // парсинг строки из порта мониторинга или регистрации
	let cntEv = 0,
		sqlEv = '',
		cntMv = 0,
		sqlMv = '';
	console.log("buff: ", buff)
	let dataCount = realSize / 16;
	for ( let i = 0; i < dataCount; i++) {
		let p = i * 16,
			d_ev = getEvDate(buff.slice(p, p+5)),
			alarm = (buff[p + 4] & 0x40) >> 6,
			code = (buff[p + 4] & 0x3F) << 8 | buff[p + 5],     //код события
			mask = (buff[p + 6] & 0xF0) >> 4,
			dev = buff[p + 6] & 0x0F; // номер картРидера 1 или 2
		if(code == 0x01 & mask == 0x00) {
			console.log("Предъявление невалидной карты. Идентификатор не зарегистрирован")
		} else if(code ==0x02 & mask == 0x00) {
			console.log("Предъявление невалидной карты. Идентификатор запрещён")
		} else if (code == 0x03 & mask == 0x00) {
			console.log("Предъявление невалидной карты. Идентификатор из «стоп-листа»")
		} else if (code == 0x04 & mask == 0x00) {
			console.log("Предъявление невалидной карты. Идентификатор просрочен")
		} else if (code == 0x05 & mask == 0x02) {
			console.log("Предъявление карты. Несоответствие временным критериям	доступа")
		} else if (code == 0x05 & mask == 0x01) {
			console.log("Предъявление карты. Несоответствие текущему местоположению")
		} else if (code == 0x05 & mask == 0x03) {
			console.log("Предъявление карты. Несоответствие  временным критериям доступа и текущему местоположению")
		} else if (code == 0x08 & mask == 0x00) {
			console.log("Запрет прохода")
		} else if (code == 0x08 & mask == 0x02) {
			console.log("Запрет прохода. Несоответствие временным критериям доступа")
		} else if (code == 0x08 & mask == 0x01) {
			console.log("Запрет прохода. Несоответствие текущему местоположению")
		} else if (code == 0x08 & mask == 0x03) {
			console.log("Запрет прохода. Несоответствие временным критериям доступа и текущему местоположению")
		} else if (code == 0x08 & mask == 0x04) {
			console.log("Запрет прохода. Нарушение комиссионирования")
		} else if (code == 0x08 & mask == 0x08) {
			console.log("Отказ от прохода. отказ в подтверждении прохода от верификации")
		} else if (code == 0x0B & mask == 0x00) {
			console.log("Предъявление запрещенной карты. Нарушение РКД ")
		} else if (code == 0x0E & mask == 0x00) {
			console.log("Запрет прохода по команде оператора")
		} else if (code == 0x0F & mask == 0x00) {
			console.log("Запрет прохода по команде от ДУ")
		} else if (code == 0x10 & mask == 0x00) {
			console.log("Отказ от прохода")
		} else if (code == 0x11 & mask == 0x00) {
			console.log("Проход по идентификатору")
		} else if (code == 0x11 & mask == 0x02) {
			console.log("Проход по идентификатору. С несоответствием временным критериям доступа")
		} else if (code == 0x11 & mask == 0x01) {
			console.log("Проход по идентификатору. С несоответствием текущему местоположению")
		} else if (code == 0x11 & mask == 0x03) {
			console.log("Проход по идентификатору. Несоответствие временным критериям доступа и текущему местоположению")
		} else if (code == 0x11 & mask == 0x04) {
			console.log("Проход по идентификатору. С нарушением комиссионирования")
		} else if (code == 0x11 & mask == 0x06) {
			console.log("Проход по идентификатору. С несоответствием временным критериям доступа и с нарушением комиссионирования")
		} else if (code == 0x11 & mask == 0x05) {
			console.log("Проход по идентификатору. С несоответствием текущему местоположению и с нарушением	комиссионирования")
		} else if (code == 0x11 & mask == 0x07) {
			console.log("Проход по идентификатору. Несоответствие временным критериям доступа и текущему местоположению и с нарушением комиссионирования")
		} else if (code == 0x11 & mask == 0x08) {
			console.log("Проход по идентификатору. При отказе в подтверждении прохода от верификации")
		} else if (code == 0x11 & mask == 0x0A) {
			console.log("Проход по идентификатору. C несоответствием временным критериям доступа и при отказе в	подтверждении прохода от верификации")
		} else if (code == 0x11 & mask == 0x09) {
			console.log("Проход по идентификатору. С несоответствием текущему местоположению и при отказе в подтверждении прохода от верификации")
		} else if (code == 0x11 & mask == 0x0B) {
			console.log("Проход по идентификатору. Несоответствие временным критериям доступа и текущему местоположению	и при отказе в подтверждении прохода от верификации")
		} else if (code == 0x1F & mask == 0x00) {
  			console.log("ИУ не закрыто после прохода по идентификатору")
		} else if (code == 0x17 & mask == 0x00) {
			console.log("Проход с подтверждением от ДУ")
		} else if (code == 0x70 & mask == 0x00) {
			console.log("Проход по команде от ДУ")
		} else if (code == 0x71 & mask == 0x00) {
			console.log("Проход по команде от ПК")
		} else if (code == 0x72 & mask == 0x00) {
			// console.log("Несанкционированный проход через ИУ (взлом ИУ)")
		} else if (code == 0x73 & mask == 0x00) {
			console.log("ИУ не закрыто после прохода от ДУ")
		} else if (code == 0x74 & mask == 0x00) {
			console.log("ИУ не закрыто после прохода от ПК")
		} else if (code == 0x75 & mask == 0x00) {
			console.log("ИУ разблокирован")
		} else if (code == 0x76 & mask == 0x00) {
			console.log("ИУ заблокирован")
		} else if (code == 0x77 & mask == 0x00) {
			console.log("Проход по команде ИК-пульта");
		}

		let	doc = 0;
		for(let nn = 0; nn < 8; nn++) {
			doc += buff[(p + 8) + nn] * Math.pow(256, nn);
		}
		event.emit("code", code, dev, doc, d_ev);
	}
}

function getEvDate(buff) {
    let second = (buff[0] & 0xFC) >> 2,
        minuteHi = buff[0] & 0x03,
        minuteLo = (buff[1] & 0xF0) >> 4,
        minute = (minuteHi << 4) + minuteLo,
        hourHi = buff[1] & 0x0F,
        hourLo = (buff[2] & 0x80) >> 7,
        hour = (hourHi << 1) + hourLo,
        day = (buff[2] & 0x7C) >> 2,
        monthHi = buff[2] & 0x03,
        monthLo = (buff[3] & 0xC0) >> 6,
        month = (monthHi << 2) + monthLo,
        yearHi = buff[3] & 0x3F,
        yearLo = (buff[4] & 0x80) >> 7,
        year =  (yearHi << 1) + yearLo + 2000,
        dt = new Date(year, month-1, day, hour, minute, second, 0).getTime()/1000;
	return dt;
}
	

function setAccessMode(idses, numReader, mode) {
	console.log('set access control');
	let realSize = 0x0002;
	let dataSize = 0x0002;
	let req = w2s(SIG_CALL);
	req+=w2s(idses ^ ((FAC_CONTROL << 8)+CTRL_ACCESS_CONTROL_MODE))
	req+=b2s(FAC_CONTROL);
	req+=b2s(CTRL_ACCESS_CONTROL_MODE);
	req+=w2s(realSize);
	req+=w2s(dataSize);
	req+=strRepeat(chr(0x00), 6);
	let data = '';
	data+=b2s(numReader);
	data+=b2s(mode);
	req+=data;
	console.log(hexEncode(req));
	return req;
}

function getDeviceState(idses) {			//получить состояние устройства
	console.log("get device state");
	let realSize = 0x0000	
	let dataSize = 0x0000
	let req = w2s(SIG_CALL)
	req+=w2s(idses ^ ((FAC_DATA << 8)+DATA_GET_DEVICE_STATE))
	req+=b2s(FAC_DATA)
	req+=b2s(DATA_GET_DEVICE_STATE)
	req+=w2s(realSize)
	req+=w2s(dataSize)
	req+=strRepeat(chr(0x00), 6);
	return req
}
function sendToMon(sesHi, sesLo) {
    let comFacility = FAC_DATA,
    comType = DATA_SEND_MONITORING_JOURNAL,
    dataSize=0x01,
    realSize = 0x01;
 
    let d = '';
    d+=w2s(SIG_RETURN);
    d+=b2s(sesHi);
    d+=b2s(sesLo);
    d+=b2s(comFacility);
    d+=b2s(comType);
    d+=w2s(dataSize),
    d+=w2s(realSize);
    d+=w2s(0x00)
    return d;
}

function sendToReg(sesHi, sesLo) {
	let comFacility = FAC_DATA,
	comType = DATA_SEND_REGISTRY_JOURNAL,
	dataSize=0x01,
	realSize = 0x01;

	let d = '';
	d+=w2s(SIG_RETURN);
	d+=b2s(sesHi);
	d+=b2s(sesLo);
	d+=b2s(comFacility);
	d+=b2s(comType);
	d+=w2s(dataSize),
	d+=w2s(realSize);
	d+=w2s(0x00)
	return d;
}

function getCmdConnect(idses, key, sd) {
	let data = getDataConnect(idses, key, sd)
	let dataSize = data.length,
		realSize = dataSize,
		comFacility = FAC_CONFIG,
		comType = CNFG_STARTS_SESSION,
		idsession = idses ^ ((comFacility << 8) + comType);
		let d = ''
		d+=w2s(SIG_CALL);
		d += w2s(idsession);
		d += b2s(comFacility);
		d += b2s(comType);
		d += w2s(dataSize);
		d += w2s(realSize);
		d += strRepeat(chr(0x00), 6);
		d += data;
		return d;
}



function getDataConnect(idses, key, sd) {	//подготовить дату для отправки
	let m = ''  
	m+=chr(sd.getSeconds());
	m+=chr(sd.getMinutes());
	m+=chr(sd.getHours())
	m+=chr(sd.getDay());
	m+=chr(sd.getDate());
	m+=chr(sd.getMonth()+1);
	m+=chr(parseInt(('' + sd.getFullYear()).slice(-2)));
	m+=encrypte('', 31, idses);
	m+=encrypte(key, 26, idses);
	return m
}

function setDataTime(idses, key) {
	let comFacility = FAC_CONTROL,
		comType = CTRL_DATETIME,
		idsession = idses ^ ((comFacility << 8) + comType);
		
	let sd = new Date();
	let m = ''
	m+=chr(sd.getSeconds());
	m+=chr(sd.getMinutes());
	m+=chr(sd.getHours());
	m+=chr(sd.getDay());
	m+=chr(sd.getDate());
	m+=chr(sd.getMonth()+1);
	m+=chr(parseInt(('' + sd.getFullYear()).slice(-2)));
	// m+=encrypte('', 31, idses);
	// m+=encrypte(key, 26, idses);
	let dataSize = 0x0007,
		realSize = 0x0007;
	let d = ''
	d+=w2s(SIG_CALL);
	d+=w2s(idsession)
	d+=b2s(comFacility)
	d+=b2s(comType)
	d+= w2s(dataSize);
	d+= w2s(realSize);
	d+= strRepeat(chr(0x00), 6);
	d+=m;

	return d

}

function b2s(n) {
	return chr(n);
}

function w2s(n, swap = true) {
	let hi = (n >> 8) & 0xFF;
	let lo = (n & 0xFF);
	if (swap) {
		return chr(lo) + chr(hi);
	} else {
		return chr(hi) + chr(lo);
	}
}

function encrypte(data, size, ses) {
	let prefix = 3;
	let TRASH = 0x00;
	let length = data.length;
	let hi = (ses >> 8) & 0xFF;
	let lo = (ses & 0xFF);
	let offset = 1 + randInt(1, 1000) % (size - length - 1 - (2 + prefix));
	let result = strRepeat(chr(TRASH), size - (2 + prefix));
	
	let n;
	for (let i = 0; i < length; i++) {
		n = ord(data[i]) ^ ((i % 2 == 1) ? hi : lo);
		let p = n & 0x07;
		p = p << 5;
		n = n >> 3;
		result = result.replaceAt(offset + i - 1, chr(ord(result[offset + i - 1]) | p));
		result = result.replaceAt(offset + i, chr(n));
	}
	result = strRepeat(chr(TRASH), prefix) + chr(offset) + chr(length) + result;
	return result;
}

function genCryptKey() {
	let k = ''
	for (let i = 0; i<16; i++){
		k +=chr(255)
	}
	return k;
}

function timeout(val) {
	return new Promise(function (resolve, reject) {
		setTimeout(function () {
			resolve()
		}, val)
	})
}

function randInt(min, max) {
	let rand = min - 0.5 + Math.random() * (max - min + 1)
	rand = Math.round(rand);
	return rand
}

function chr(ascii) {					
	return String.fromCharCode(ascii);
}

function strRepeat(input, multiplier) {			//повторение байта
	var buf = '';
	for (i=0; i < multiplier; i++){
		buf += input;
	}
	return buf;
}

function ord(string) {
	return string.charCodeAt(0);
}


function getDocData(doc){		//конвертирование номера карты в 16 сс
    let b1 = (doc & 0x0000FF),
    	b2 = (doc & 0x00FF00) >> 8,
    	b3 = (doc & 0xFF0000) >> 16,
    	x = b3 * 256 * 256 + b2 * 256 + b1;
    // echo "dic=$doc => $b3*256*256 + $b2*256 + $b3 = $x   " . dechex($b3) . ' ' . dechex($b2) . ' ' . dechex($b1) . "\n";
    return chr(b1) + chr(b2) + chr(b3) + strRepeat(chr(0x00), 5);
}

function getCmdDocLoad(idses, data){
    let realSize = data.length;
    let salt = realSize % 16;
    let dataSize = ((realSize % 16) == 0) ? realSize : (realSize + 16 - (realSize % 16));
    
    let d = w2s(SIG_CALL);
    d += w2s(idses ^ ((FAC_CONFIG << 8) + CNFG_LOAD_IDENTIFIERS));
    d += b2s(FAC_CONFIG);
    d += b2s(CNFG_LOAD_IDENTIFIERS);
    d += w2s(dataSize);
    d += w2s(realSize);
	d += strRepeat(chr(0x00), 6);
	
    d += data;
    if (salt > 0)
        d += strRepeat(chr(0x00), 16 - salt);
    return d;
}
function getCmdReadConfig(idses, type, num, par=0x00) {		//запрос конфига
	let data = b2s(type) + b2s(num) + b2s(par) + chr(0x00)
	let realSize = data.length
	let salt = realSize % 16 
	let dataSize = ((realSize % 16) == 0) ? realSize : (realSize+16-(realSize%16))
	
	let d = w2s(SIG_CALL)
	d+=w2s(idses ^ ((FAC_DIAGNOSTIC << 8)+DGN_READ_CONFIG))
	d+=b2s(FAC_DIAGNOSTIC)
	d+=b2s(DGN_READ_CONFIG)
	d+=w2s(dataSize)
	d+=w2s(realSize)
	d+=strRepeat(chr(0x00), 6)
	d+=data
	if(salt>0) {
		d +=strRepeat(chr(0x00), 16 - salt)
	}
	return d
}

function hexEncode(str) {
	var hex, i;
	var result = "";
	for (i=0; i<str.length; i++) {
		hex = str.charCodeAt(i).toString(16);
		result += " " +(hex).slice(-4);
	}
	return result
}

function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
}

module.exports.docList = docList
module.exports.event = event
module.exports.SIG_CALL = SIG_CALL
module.exports.SIG_RETURN = SIG_RETURN
module.exports.FAC_CONFIG = FAC_CONFIG
module.exports.FAC_CONTROL = FAC_CONTROL
module.exports.FAC_DATA = FAC_DATA
module.exports.FAC_DIAGNOSTIC = FAC_DIAGNOSTIC
module.exports.FAC_SERVICE = FAC_SERVICE
module.exports.FAC_DEBUG = FAC_DEBUG
module.exports.REQUEST_CONFIG = REQUEST_CONFIG
module.exports.CHANGE_CONFIG = CHANGE_CONFIG
module.exports.CNFG_STARTS_SESSION = CNFG_STARTS_SESSION
module.exports.CNFG_LOAD_IDENTIFIERS = CNFG_LOAD_IDENTIFIERS
module.exports.CNFG_ADD_IDENTIFIERS = CNFG_ADD_IDENTIFIERS
module.exports.CNFG_DEL_IDENTIFIERS = CNFG_DEL_IDENTIFIERS
module.exports.CTRL_DATETIME = CTRL_DATETIME
module.exports.CTRL_ACCESS_CONTROL_MODE = CTRL_ACCESS_CONTROL_MODE
module.exports.DATA_SEND_REGISTRY_JOURNAL = DATA_SEND_REGISTRY_JOURNAL // Facility DATA = 0x04
module.exports.DATA_SEND_MONITORING_JOURNAL = DATA_SEND_MONITORING_JOURNAL
module.exports.DATA_GET_DEVICE_STATE = DATA_GET_DEVICE_STATE
module.exports.FACTORY_SETTINGS = FACTORY_SETTINGS
module.exports.USER_SETTINGS = USER_SETTINGS
module.exports.DGN_READ_CONFIG = DGN_READ_CONFIG, // FAC_DIAGNOSTIC - 0x05
module.exports.DOC_COUNT = DOC_COUNT
module.exports.DOC_LIST = DOC_LIST
module.exports.SOFTWARE_VERSION = SOFTWARE_VERSION
module.exports.CALENDAR = CALENDAR
module.exports.SVC_KEEP_ALIVE = SVC_KEEP_ALIVE //SERVICE
module.exports.DEBUG_DATA_SEND_MSG = DEBUG_DATA_SEND_MSG //DEBUG

module.exports.getDeviceState = getDeviceState
module.exports.getCmdReadConfig = getCmdReadConfig
module.exports.getCmdConnect = getCmdConnect
module.exports.getDataConnect = getDataConnect
module.exports.setDataTime = setDataTime
module.exports.getCmdDocLoad = getCmdDocLoad
module.exports.b2s = b2s
module.exports.w2s = w2s
module.exports.encrypte = encrypte
module.exports.genCryptKey = genCryptKey
module.exports.timeout = timeout
module.exports.randInt = randInt
module.exports.chr = chr
module.exports.strRepeat = strRepeat
module.exports.ord = ord
module.exports.getDocData = getDocData
module.exports.sendToMon = sendToMon
module.exports.getEvDate = getEvDate
module.exports.timeConverter = timeConverter
module.exports.sendToReg = sendToReg
module.exports.parseEvent = parseEvent
module.exports.setAccessMode = setAccessMode