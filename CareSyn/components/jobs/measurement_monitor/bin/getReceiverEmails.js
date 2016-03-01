'use strict';

var Q = require('q');
var _ = require('lodash');
var UserPreferenceModel = require('models').UserPreference;

module.exports = function(User)
{
    var deferred = Q.defer(), emails = []; //indicate no email was sent
    //fetch users reporting emails
    User
    .getReportingEmails()
    .then(function(results){
            if(!_.isEmpty(results))
            {
                emails = results.split(',');
            }
            else{
                //if no reporting email found
                //emails are sent to users
                emails.push(User.email);
            }

        deferred.resolve(emails);
    });

    return deferred.promise;
};
