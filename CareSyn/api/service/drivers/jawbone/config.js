"use strict";
var config = {
   development: {
     client_id: "QoQ24Gc5XV8",
     client_secret: "f41cd1c03fbed4b55aed4a675eb58cf77fa25106"
   },
   staging: {
       client_id: "4XZPx31KqpA",
       client_secret: "bbdb60dac1f079489bb08567a31bd22831a40a04"
   },
   production: {
       client_id: "aR-S8xhiiDU",
       client_secret: "abfd18710e68b1c59ea355c3e22a14cebb7ee3bc"
   },
   test: {
     client_id: "QoQ24Gc5XV8",
     client_secret: "f41cd1c03fbed4b55aed4a675eb58cf77fa25106"
   }
};


module.exports = function(env){
  env = env || 'development';
  return config[env];
};
