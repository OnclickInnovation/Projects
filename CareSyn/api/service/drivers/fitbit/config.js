"use strict";
var config = {
   development: {
     client_id: "229YS3",
     client_secret: "4cd73a633a89669e253e9e62f5893619",
     client_key: "559e7fd835151f16211b4b186f3c03c6"
   },
   staging: {
       client_id: "227J8C",
       client_secret: "a20893976af346eccf0376ef69b5f23d",
       client_key: "37b08421bcdb2bd2016f4b2ba68a01b9"
   },
   production: {
       client_id: "229WLP",
       client_secret: "9edcf16d9e482479994f1fc501a1619e",
       client_key: "6910aa83638804a73a6d65f2d507fcde"
   },
   test: {
       client_id: "229YS3",
       client_secret: "4cd73a633a89669e253e9e62f5893619",
       client_key: "559e7fd835151f16211b4b186f3c03c6"
   }
};


module.exports = function(env){
  env = env || 'development';
  return config[env];
};
