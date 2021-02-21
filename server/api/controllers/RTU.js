const asyncHandler = require("express-async-handler");
const fs = require("fs");

exports.get = ((req, res) => {

    const currentTaskFile = 'api/realtimeUpdate/currentFamilies.json';

    var currentFamilies = [];

    if (fs.existsSync(currentTaskFile)) {

        const currentTasks = fs.readFileSync(currentTaskFile)
        currentFamilies = JSON.parse(
            currentTasks
        ).familyList;
    }

    res.status(200).send(currentFamilies)
})


exports.add = ((req, res) => {

    const currentFamily = req.body.familyID

    const currentTaskFile = 'api/realtimeUpdate/currentFamilies.json';

    var currentFamilies = [];

    if (fs.existsSync(currentTaskFile)) {

        const currentTasks = fs.readFileSync(currentTaskFile)
        currentFamilies = JSON.parse(
            currentTasks
        ).familyList;

        currentFamilies.push(currentFamily);
        fs.writeFileSync(currentTaskFile, JSON.stringify({ familyList: currentFamilies }));
    }

    res.status(200).send(currentFamilies)
})


exports.remove = ((req, res) => {
    const currentFamily = req.body.familyID

    const currentTaskFile = 'api/realtimeUpdate/currentFamilies.json';

    var currentFamilies = [];

    if (fs.existsSync(currentTaskFile)) {

        const currentTasks = fs.readFileSync(currentTaskFile)
        currentFamilies = JSON.parse(
            currentTasks
        ).familyList;

        const index = currentFamilies.indexOf(currentFamily)

        if (index > -1) {

            currentFamilies.splice(index, 1);

        }

        fs.writeFileSync(currentTaskFile, JSON.stringify({ familyList: currentFamilies }));
    }

    res.status(200).send(currentFamilies)
})

exports.reset = ((req, res) => {

    const currentTaskFile = 'api/realtimeUpdate/currentFamilies.json';

    if (fs.existsSync(currentTaskFile)) {

        const currentTasks = fs.readFileSync(currentTaskFile)
        var currentList = JSON.parse(
            currentTasks
        )
        currentList.familyList = [];

        fs.writeFileSync(currentTaskFile, JSON.stringify(currentList));
    }

})