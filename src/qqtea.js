'use strict';
const delta = 0x9E3779B9;
const delta_n = 0x57E89147;

function encrypt(_Data, _KEY) {
    var FILL_N_OR = 0xF8;
    var filln = (8 - (_Data.length + 2)) % 8;

    filln += 2 + (filln < 0 ? 8 : 0);
    var fills = (new Array(filln + 1)).join(',').replace(/,/g, function(){
        return String.fromCharCode(parseInt(Math.random() * 0x100));
    });

    var _Data_buf = String.fromCharCode((filln - 2) | FILL_N_OR) + //(填充的长度 - 2) | FILL_N_OR
        fills + //填充的字符
        _Data + //原数据
        String.fromCharCode.apply(String, [0, 0, 0, 0, 0, 0, 0]);//尾部填充的 7 字节的 \0
    var tr = '\x00\x00\x00\x00\x00\x00\x00\x00',
        to = tr,
        r = '',
        o = tr;

    for(var i = 0; i < _Data_buf.length ; i += 8){
        o = xor(_Data_buf.substr(i, 8), tr);
        tr = xor(encipher(o, _KEY, delta, 0x10), to);
        to = o;
        r += tr;
    }
    return r;
}

function encrypt_n(_Data, _KEY){
    var FILL_N_OR = 0xF8;
    var filln = (8 - (_Data.length + 2)) % 8;

    filln += 2 + (filln < 0 ? 8 : 0);
    var fills = (new Array(filln + 1)).join(',').replace(/,/g, function(){
        return String.fromCharCode(parseInt(Math.random() * 0x100));
    });

    var _Data_buf = String.fromCharCode((filln - 2) | FILL_N_OR) + //(填充的长度 - 2) | FILL_N_OR
        fills + //填充的字符
        _Data + //原数据
        String.fromCharCode.apply(String, [0, 0, 0, 0, 0, 0, 0]);//尾部填充的 7 字节的 \0
    var tr = '\x00\x00\x00\x00\x00\x00\x00\x00',
        to = tr,
        r = '',
        o = tr;

    for(var i = 0; i < _Data_buf.length ; i += 8){
        o = xor(_Data_buf.substr(i, 8), tr);
        tr = xor(encipher(o, _KEY, delta_n, 0x20), to);
        to = o;
        r += tr;
    }

    return r;
}

function encipher(_Data, _KEY, _Delta, _Round){
    var _Delta_buf = _Delta;
    var _Data_buf = stringToLongArray(_Data);
    var _KEY_buf = stringToLongArray(_KEY);

    while(_Round-- > 0){
        //_Data_buf[0] += (((_Data_buf[1] << 4 & 0xFFFFFFF0) + _KEY_buf[0]) >>> 0) ^ ((_Data_buf[1] + _Delta_buf) >>> 0) ^ (((_Data_buf[1] >> 5 & 0x07FFFFFF) + _KEY_buf[1]) >>> 0);
        //_Data_buf[1] += (((_Data_buf[0] << 4 & 0xFFFFFFF0) + _KEY_buf[2]) >>> 0) ^ ((_Data_buf[0] + _Delta_buf) >>> 0) ^ (((_Data_buf[0] >> 5 & 0x07FFFFFF) + _KEY_buf[3]) >>> 0);
        //_Data_buf[0] = _Data_buf[0] >>> 0;
        //_Data_buf[1] = _Data_buf[1] >>> 0; //还原出真实运算值
        //_Delta_buf = (_Delta_buf + _Delta) >>> 0;

        _Data_buf[0] += ((_Data_buf[1] << 4 & 0xFFFFFFF0) + _KEY_buf[0]) ^ (_Data_buf[1] + _Delta_buf) ^ ((_Data_buf[1] >> 5 & 0x07FFFFFF) + _KEY_buf[1]);
        _Data_buf[1] += ((_Data_buf[0] << 4 & 0xFFFFFFF0) + _KEY_buf[2]) ^ (_Data_buf[0] + _Delta_buf) ^ ((_Data_buf[0] >> 5 & 0x07FFFFFF) + _KEY_buf[3]);
        _Delta_buf += _Delta;
    }
    return longArrayToString(_Data_buf);
}

function encipher_n(_Data, _KEY){
    return encipher(_Data, _KEY, delta, 0x10);
}

function decrypt(_Data, _KEY){
    var preCrypt = _Data.substr(0, 8);
    var prePlain = decipher(preCrypt, _KEY, delta, 0x10);

    var pos = (prePlain.charCodeAt(0) & 0x7) + 2;
    var r = prePlain, x;

    for(var i = 8; i < _Data.length; i += 8){
        x = xor(decipher(xor(_Data.substr(i, 8), prePlain), _KEY, delta, 0x10), preCrypt);
        prePlain = xor(x, preCrypt);
        preCrypt = _Data.substr(i, 8);
        r += x;
    }

    if(parseInt(bin2hex(r.substr(r.length - 7)), 16) !== 0){
        return '';
    }

    pos++;

    return r.substr(pos, r.length - 7 - pos);
}

function decrypt_n(_Data, _KEY){ // TBD
    var preCrypt = _Data.substr(0, 8);

    var prePlain = decipher(preCrypt, _KEY, delta_n, 0x20);

    var pos = (prePlain.charCodeAt(0) & 0x7) + 2;

    var r = prePlain, x;

    for(var i = 8; i < _Data.length; i += 8){
        x = xor(decipher(xor(_Data.substr(i, 8), prePlain), _KEY, delta_n, 0x20), preCrypt);
        prePlain = xor(x, preCrypt);
        preCrypt = _Data.substr(i, 8);
        r += x;
    }

    if(parseInt(bin2hex(r.substr(r.length - 7)), 16) !== 0){
        return '';
    }

    pos++;

    return r.substr(pos, r.length - 7 - pos);
}

function decipher(_Data, _KEY, _Delta, _Round){
    var _Delta_buf = (_Delta * _Round) >>> 0;
    var _Data_buf = stringToLongArray(_Data);
    var _KEY_buf = stringToLongArray(_KEY);
    while(_Round-- > 0){
        _Data_buf[1] -= (((_Data_buf[0] << 4 & 0xFFFFFFF0) + _KEY_buf[2]) ^ (_Data_buf[0] + _Delta_buf) ^ ((_Data_buf[0] >> 5 & 0x07FFFFFF) + _KEY_buf[3]));
        _Data_buf[1] = _Data_buf[1] >>> 0;
        _Data_buf[0] -= (((_Data_buf[1] << 4 & 0xFFFFFFF0) + _KEY_buf[0]) ^ (_Data_buf[1] + _Delta_buf) ^ ((_Data_buf[1] >> 5 & 0x07FFFFFF) + _KEY_buf[1]));
        _Data_buf[0] = _Data_buf[0] >>> 0;
        _Delta_buf -= _Delta;
    }
    return longArrayToString(_Data_buf);
}

function decipher_n(_Data, _KEY){
    return decipher(_Data, _KEY, delta, 0x10);
}

function xor(a, b){
    a = bin2hex(a);
    b = bin2hex(b);

    var l = a.length, t, ret = [];

    for(var i=0; i<l; i += 4){
        t = '0000' + (parseInt(a.substr(i, 4), 16) ^ parseInt(b.substr(i, 4), 16)).toString(16);
        ret.push(t.substr(t.length - 4));
    }

    return hex2bin(ret.join(''));
}

function hex2bin(_Data){
    return _Data.replace(/\s/g, '').replace(/(..)/g, function(a, b){
        return String.fromCharCode(parseInt(b, 16));
    });
}

function bin2hex(_Data){
    var ret = [];
    for(var i = _Data.length; i--;){
        var c = '00' + _Data.charCodeAt(i).toString(16);
        ret.push(c.substr(c.length - 2));
    }
    return ret.reverse().join('');
}

function bin2hex_log(_Data){
    var ret = [];
    for(var i = _Data.length; i--;){
        var c = '00' + _Data.charCodeAt(i).toString(16).toUpperCase();
        ret.push(c.substr(c.length - 2));
    }
    return ret.reverse().join(' ');
}

function stringToLongArray(str) {
    var result = [];
    for (var i = 0, length = str.length; i < length; i += 4) {
        result.push(((
            str.charCodeAt(i + 0) << 24 |
            str.charCodeAt(i + 1) << 16 |
            str.charCodeAt(i + 2) << 8 |
            str.charCodeAt(i + 3)
            ) >>> 0));
    }
    return result;
}

function longArrayToString(data) {
    for (var i = 0, length = data.length; i < length; i++) {
        data[i] = String.fromCharCode(
            data[i] >> 24 & 0xFF,
            data[i] >> 16 & 0xFF,
            data[i] >> 8  & 0xFF,
            data[i] & 0xFF
        );
    }
    return data.join('');
}


exports.encrypt = encrypt;
exports.encrypt_n = encrypt_n;
exports.encipher = encipher_n;

exports.decrypt = decrypt;
exports.decrypt_n = decrypt_n;
exports.decipher = decipher_n;

exports.bin2hex = bin2hex;
exports.bin2hex_log= bin2hex_log;
exports.hex2bin = hex2bin;
