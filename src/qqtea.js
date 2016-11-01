const Pack_Builder = require('../module/Pack_Builder');
const Config = require('../src/Config');

var QQ_Model = new Pack_Builder.QQ_Model(3175422755,'qazxswedc1');
QQ_Model.Pack_0825_TLV_0112_SigIP2.Value = Pack_Builder.hex2bin('CB 5A C5 D8 5B F4 3E 7A EF 41 64 71 B6 9D 68 5E BF 10 DF 90 5B 2A 0A F5 A8 6B 82 9D F4 F6 44 59 D4 1A 91 A3 76 85 07 FE E6 6E 04 4A B9 8F FC 5B FF 8C DC C6 C7 4F 0B 96');
QQ_Model.Pack_0836_TLV_0006_TGTGT.Value = Pack_Builder.hex2bin('BF 0B FF 81 41 3F D8 4D 8B 54 06 7C DF BD 37 EC BC 20 A2 46 AD DD 7A 16 F8 D2 D0 8C B1 49 59 E6 51 DD C4 53 6C 4C 69 86 CB 4F 2C 19 A3 12 3F 7D 0D 63 EE 3B 39 24 67 DB 64 BB 72 C0 16 3D 4A 7A 96 E4 AF 43 B0 3D B7 09 3F 97 33 66 52 68 27 5A B4 B0 EB 59 80 2A 9D E1 8B 0C 27 A3 E4 6F A5 EC 8A 62 6F 76 26 BB 57 27 B1 62 36 98 C7 EC 22 C5 28 65 EB 2D 4A 86 EF 92');

{
    var bufCsCmdCryptKey = Pack_Builder.hex2bin('1B 2C 03 B2 D0 46 62 6A AE 90 D3 4D B5 04 A8 F1');
    var bufOfficial =new Buffer('\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00', 'binary');
    Pack_Temp = Pack_Builder.hex2bin('00 01');// Ver -> WORD
    Pack_Temp += bufCsCmdCryptKey;// bufOfficialKey -> 0x10 BYTE
    Pack_Temp += Pack_Builder.Pack_TLV('', 2, QQ_Model.Pack_0825_TLV_0112_SigIP2.Value);
    // Official_Calc
    {
        const Time_Zone = 8 * 0x3C; //China  8 * 0x3C
        const TmOffMod = 19;
        const TmOffModAdd = 5;
        const round = 256;
        const MD5_INFO_Count = 4;
        var MD5_bufCsCmdCryptKey = new Buffer(Pack_Builder.md5(bufCsCmdCryptKey, 'binary'), 'binary');
        var MD5_SigIP2 = new Buffer(Pack_Builder.md5(QQ_Model.Pack_0825_TLV_0112_SigIP2.Value, 'binary'), 'binary');
        var MD5_TGTGT = new Buffer(Pack_Builder.md5(QQ_Model.Pack_0836_TLV_0006_TGTGT.Value, 'binary'), 'binary');
        var MD5_Hash = new Buffer('\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00', 'binary');

        var Seq = new Buffer.allocUnsafe(round);
        var LS = new Buffer.allocUnsafe(round);
        for (var i = 0; i < round; i++) {
            Seq[i] = i;
            LS[i] = MD5_SigIP2[i % 0x10];
        }

        for (var i = 0, k = 0, v = 0; i < round; i++) {
            k = (k + Seq[i] + LS[i]) % round;
            v = Seq[k];
            Seq[k] = Seq[i];
            Seq[i] = v;
        }

        for (var i = 0, k = 0, v = 0; i < MD5_Hash.length; i++) {
            k = (k + Seq[i + 1]) % round;
            v = Seq[k];
            Seq[k] = Seq[i + 1];
            Seq[i + 1] = v;
            v = (Seq[k] + Seq[i + 1]) % round;
            MD5_Hash[i] = Seq[v] ^ MD5_bufCsCmdCryptKey[i];
        }

        var MD5_Final = new Buffer(Pack_Builder.md5(MD5_bufCsCmdCryptKey.toString('binary') + MD5_SigIP2.toString('binary') + MD5_Hash.toString('binary') + MD5_TGTGT.toString('binary'), 'binary'), 'binary');

        console.log('MD5_Final', Pack_Builder.bin2hex_log(MD5_Final.toString('binary')));
        for (var i = 0, MD5_bufCsCmdCryptKey = MD5_Final; i < (Time_Zone % TmOffMod + TmOffModAdd); i++){
            MD5_bufCsCmdCryptKey = new Buffer(Pack_Builder.md5(MD5_bufCsCmdCryptKey, 'binary'), 'binary');
        }

        for(var i = 0, MD5_Final_Left = MD5_Final.toString('binary').substr(0, 8), MD5_Final_Right = MD5_Final.toString('binary').substr(8, 8), MD5_INFO = []; i < MD5_INFO_Count; i++){
            switch (i){
                case 0:{
                    MD5_INFO = MD5_bufCsCmdCryptKey.swap32().toString('binary');
                    break;
                }
                case 1:{
                    MD5_INFO = MD5_SigIP2.swap32().toString('binary');
                    break;
                }
                case 2:{
                    MD5_INFO = MD5_Hash.swap32().toString('binary');
                    break;
                }
                case 3:{
                    MD5_INFO = MD5_TGTGT.swap32().toString('binary');
                    break;
                }
            }

            var final_hash_left = Pack_Builder.encipher(MD5_Final_Left, MD5_INFO);
            var final_hash_right = Pack_Builder.encipher(MD5_Final_Right, MD5_INFO);
            var final_hash = new Buffer(final_hash_left + final_hash_right, 'binary');

            console.log('final_hash_left  ->', Pack_Builder.bin2hex_log(final_hash_left));


            for (var j = i; j < MD5_INFO.length; j++){
                bufOfficial[j] = bufOfficial[j] ^ final_hash[j];
            }
        }
    }

    console.log(Pack_Builder.bin2hex_log(bufCsCmdCryptKey));
    console.log(Pack_Builder.bin2hex_log(QQ_Model.Pack_0825_TLV_0112_SigIP2.Value));
    console.log(Pack_Builder.bin2hex_log(QQ_Model.Pack_0836_TLV_0006_TGTGT.Value));

    bufOfficial = Pack_Builder.md5(bufOfficial.toString('binary'), 'binary');

    console.log(Pack_Builder.bin2hex_log(bufOfficial));

}
