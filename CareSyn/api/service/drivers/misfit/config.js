"use strict";
var config = {
   development: {
     client_id: "6uRjmx5Q3snb13pI",
     client_secret: "eNX38L6kT4KerTBiPyxNMPbf44rtIxvB"
   },
   staging: {
       client_id: "OUi5BAPGoMFVBdQE",
       client_secret: "cYJ0jTOjsZwEIcHiaKTMFKYAUApZG8k4"
   },
   production: {
       client_id: "9NaMbjJ6ausHiv0p",
       client_secret: "VaqUIlfp3MyWDDARjuyIUO1UrmuICpph"
 },
 test: {
     client_id: "6uRjmx5Q3snb13pI",
     client_secret: "eNX38L6kT4KerTBiPyxNMPbf44rtIxvB"
 }
};


module.exports = function(env){
  env = env || 'development';
  return config[env];
};
