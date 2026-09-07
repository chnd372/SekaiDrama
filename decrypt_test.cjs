const CryptoJS = require("crypto-js");
const fs = require("fs");
const s = CryptoJS.AES.decrypt(fs.readFileSync("/opt/data/SekaiDrama/enc.txt","utf8").trim(), "Sansekai-SekaiDrama").toString(CryptoJS.enc.Utf8);
console.log(s.slice(0, 300));