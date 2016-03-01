"use strict";
var Q = require('q');

module.exports = {
    marshal: function (userModel) {
        return userModel
                .getReportingEmails()
                .then(function(emails){
                return  Q.spread([userModel.getRole()], function (role) {
                        return {
                          id: userModel.id,
                          name: userModel.first_name + (userModel.middle_name ? ' ' + userModel.middle_name + ' ' : ' ') + userModel.last_name,
                          first_name: userModel.first_name,
                          last_name: userModel.last_name,
                          middle_name: userModel.middle_name,
                          title: userModel.title,
                          email: userModel.email,
                          role: role.name,
                          lastActivity: userModel.lastActivity,
                          reportingEmails: emails
                        };
                });
            });
    },
    unmarshal: function (rawData) {
        return rawData;
    }
};
