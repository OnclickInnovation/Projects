'use strict';
var _ = require('lodash');

//get latest reading and its date from data supplied by picking first key-value pair.
var getData = function(data)
{

    if(_.isEmpty(data)){
        return false;
    }

    var date = Object.keys(data)[0];
    return {'date': date, 'reading': data[date]};
};

module.exports = function(measurement, serviceName, results, allData)
{
    if(measurement)
    {
      //if blood pressure
      if(measurement.name.toLowerCase() === 'blood pressure')
      {
          return !allData ? getData(results.data["Blood Pressure"]) : results.data["Blood Pressure"];
      }

      //if steps
      if(measurement.name.toLowerCase() === 'steps')
      {
          if(_.isEmpty(results.data.Steps)){
              return false;
          }

          var date = Object.keys(results.data.Steps)[0];

          return !allData ? {'date': date, 'reading': results.data.Steps[date]} : results.data.Steps;
      }

      //if sleep
      if(measurement.name.toLowerCase() === 'sleep')
      {
          if(_.isEmpty(results.data.Sleep)){
              return false;
          }

          var date = Object.keys(results.data.Sleep)[0];

          return !allData ? {'date': date, 'reading': results.data.Sleep[date]} : results.data.Sleep;
      }

      //if glucose
      if(measurement.name.toLowerCase() === 'glucose')
      {
        return !allData ? getData(results.data["Glucose (mg/dL)"]) : results.data["Glucose (mg/dL)"];
      }

      //if weight
      if(measurement.name.toLowerCase() === 'weight')
      {
        return !allData ? getData(results.data["Weight (lbs)"]) : results.data["Weight (lbs)"];
      }
    }
    return false;
};
