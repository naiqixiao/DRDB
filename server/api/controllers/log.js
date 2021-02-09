const fs = require("fs");
const jsonexport = require('jsonexport');
const moment = require("moment");

exports.createLog = async function (logType, user, note) {
  try {
    var folderName = "";

    switch (logType) {
      // case 'Family Created':
      // case 'Family Updated':
      // case 'Family Removed':
      // case 'Family Deleted':
      // case 'Child Created':
      // case 'Child Updated':
      // case 'Child Deleted':
      // case 'Age Updated':
      //   folderName = "api/logs"
      //   break;
      //   Auto_log
      case 'Family Lab Assisgnment Release':
      case 'Login Not Exist':
      case 'Age Updated':
        folderName = "api/logs/AutoLogs"

        user = {
          Name: '',
          Email: '',
          LabName: ''
        }
        break;

      default:
        folderName = "api/logs/" + user.LabName
        break
    }

    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName)
    }

    var log = [{
      Type: logType,
      User: user.Name,
      Email: user.Email,
      Lab: user.LabName,
      Log: note,
      Date: moment().format(
        "MM/DD/YYYY"
      ),
      Time: moment().format(
        "H:m"
      ),
    }]

    var fileName = moment().startOf('week').format(
      "[Log_]YYYY_MM_DD[.csv]"
    ),

      logCSV = await jsonexport(log)

    const logFile = folderName + "/" + fileName;

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logCSV)
    } else {
      fs.writeFileSync(logFile, logCSV)
    }
  }
  catch (err) {
    throw err
  }
};