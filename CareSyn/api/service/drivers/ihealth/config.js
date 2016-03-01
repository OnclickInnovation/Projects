"use strict";
var config = {
   development: {
     client_id: "698bf510f0e442fe8f039bfd7c595907",
     client_secret: "34c7f14808c34a99b49aef5f795365a3",
     SC: "50d8847b95384f649029eac8defbd52f",
     SV: {
       OpenApiBP: "0c30de931e49410a965e7961121b2f59",
       OpenApiBG: "53ff607c493d4660a0888fcda3dca126",
       OpenApiSpO2: "affc05a7d8e9482a87cc8c5c435fbe8c",
       OpenApiWeight: "41bd5657609e4a178b47be8d1d3e008d",
       OpenApiActivity: "8c7d2a40cc8a49b9a94cda1dc2bd31aa",
       OpenApiUserInfo: "02250631a80f411c8c21b1f0d6858039"
     }
   },
   staging: {
     client_id: "6970ff5395b24d76972915459f20f51d",
     client_secret: "f4e8ee8366554ddd8150467eb6c7fbaa",
     SC: "50D8847B95384F649029EAC8DEFBD52F",
     SV: {
       OpenApiBP: "0C30DE931E49410A965E7961121B2F59",
       OpenApiBG: "53FF607C493D4660A0888FCDA3DCA126",
       OpenApiSpO2: "AFFC05A7D8E9482A87CC8C5C435FBE8C",
       OpenApiWeight: "41bd5657609e4a178b47be8d1d3e008d",
       OpenApiActivity: "8c7d2a40cc8a49b9a94cda1dc2bd31aa",
       OpenApiUserInfo: "02250631A80F411C8C21B1F0D6858039"
     }
   },
   production: {
     client_id: "cc63f715dcd94ee1b5b3c6b9a5476385",
     client_secret: "7ee66eb4276d4a44bb4d3e2ce7052617",
     SC: "50D8847B95384F649029EAC8DEFBD52F",
     SV: {
       OpenApiBP: "0C30DE931E49410A965E7961121B2F59",
       OpenApiBG: "53FF607C493D4660A0888FCDA3DCA126",
       OpenApiSpO2: "AFFC05A7D8E9482A87CC8C5C435FBE8C",
       OpenApiWeight: "41bd5657609e4a178b47be8d1d3e008d",
       OpenApiActivity: "8c7d2a40cc8a49b9a94cda1dc2bd31aa",
       OpenApiUserInfo: "02250631A80F411C8C21B1F0D6858039"
     }
 },
 test: {
     client_id: "698bf510f0e442fe8f039bfd7c595907",
     client_secret: "34c7f14808c34a99b49aef5f795365a3",
     SC: "50d8847b95384f649029eac8defbd52f",
     SV: {
       OpenApiBP: "0c30de931e49410a965e7961121b2f59",
       OpenApiBG: "53ff607c493d4660a0888fcda3dca126",
       OpenApiSpO2: "affc05a7d8e9482a87cc8c5c435fbe8c",
       OpenApiWeight: "41bd5657609e4a178b47be8d1d3e008d",
       OpenApiActivity: "8c7d2a40cc8a49b9a94cda1dc2bd31aa",
       OpenApiUserInfo: "02250631a80f411c8c21b1f0d6858039"
     }
 }
};


module.exports = function(env){
  env = env || 'development';
  return config[env];
};
