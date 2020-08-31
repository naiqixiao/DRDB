const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");
const { OAuth2 } = google.auth;
const fs = require("fs");

const moment = require('moment');

function childNames(Appointments) {
    var nameList = Appointments.map((appointment) => {
        return appointment.Child.Name;
    });

    nameList = Array.from(new Set(nameList));

    var childNames = "";

    if (nameList.length <= 2) {
        childNames = nameList.join(" and ");
    } else {
        childNames = "your " + nameList.length + " children";
    }
    return childNames;
}

function emailBody(schedule) {
    const emailSubject =
        "Reminder for your tomorrow's study appointment with " +
        childNames(schedule.Appointments)

    // " on " +
    // moment(schedule.AppointmentTime).format(
    //     "MMM D (ddd), [at] h:mma"
    // );
    const opening =
        "<p>Dear " +
        schedule.Appointments[0].Family.NameMom.split(" ")[0] +
        ",</p>" +
        "<p>This is a reminder for your visit to " + schedule.Appointments[0].Study.Lab.LabName + " with " +
        childNames(schedule.Appointments) +
        moment(schedule.AppointmentTime).format(
            " [on] dddd [(]MMM Do[)] [at] h:mma"
        ) +
        ".</p>"
    // var emailBodyList = [];

    // schedule.Appointments.forEach((appointment) => {
    //     var emailBody = appointment.Study.EmailTemplate;

    //     if (appointment.Child.Sex == "F") {
    //         emailBody = emailBody.replace(/\${{he\/she}}/g, "she" || "");
    //         emailBody = emailBody.replace(/\${{his\/her}}/g, "her" || "");
    //         emailBody = emailBody.replace(/\${{him\/her}}/g, "her" || "");
    //     } else {
    //         emailBody = emailBody.replace(/\${{he\/she}}/g, "he" || "");
    //         emailBody = emailBody.replace(/\${{his\/her}}/g, "his" || "");
    //         emailBody = emailBody.replace(/\${{him\/her}}/g, "him" || "");
    //     }

    //     emailBody = emailBody.replace(
    //         /\${{childName}}/g,
    //         appointment.Child.Name || ""
    //     );

    //     emailBody = emailBody.replace(/\. he/g, ". He");
    //     emailBody = emailBody.replace(/\. his/g, ". His");
    //     emailBody = emailBody.replace(/\. she/g, ". She");
    //     emailBody = emailBody.replace(/\. her/g, ". Her");

    //     emailBodyList.push(emailBody);
    // });


    // location
    const location =
        "<p>" + schedule.Appointments[0].Study.Lab.TransportationInstructions + "</p>"

    // closing
    const closing =
        "<p>" + schedule.Appointments[0].Study.Lab.EmailClosing + "</p>" +
        "<p>Best,<br>" +
        schedule.Personnel.Name +
        "<br>" +
        schedule.Personnel.Role +
        "<br>" +
        schedule.Appointments[0].Study.Lab.LabName +
        "</p>";

    const emailBody =
        opening +
        // emailBodyList.join("<p></p>") +
        location + closing;

    const emailContent = {
        from:
            schedule.Appointments[0].Study.Lab.LabName + "<" + schedule.Appointments[0].Study.Lab.Email + ">",
        // cc: "lab email <nx@kangleelab.com>",
        //to: schedule.Appointments[0].Family.NameMom +
        // "<" +
        // schedule.Appointments[0].Family.Email +
        // ">",
        to:
            schedule.Appointments[0].Family.NameMom +
            "<" +
            schedule.Appointments[0].Study.Lab.Email +
            ">",
        subject: emailSubject,
        body: emailBody,
    };

    return emailContent;
}

function makeBody(to, from, cc, subject, body) {
    var message = [
        'Content-Type: text/html; charset="UTF-8"\n',
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: ",
        to,
        "\n",
        "from: ",
        from,
        "\n",
        "cc: ",
        cc,
        "\n",
        "subject: ",
        subject,
        "\n\n",
        body,
    ].join("");

    var encodedMail = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    return encodedMail;
}

async function sendEmail(oAuth2Client, emailContent) {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    var raw = makeBody(
        emailContent.to,
        emailContent.from,
        emailContent.cc,
        emailContent.subject,
        emailContent.body
    );

    try {
        const result = await gmail.users.messages.send({
            userId: "me",
            requestBody: {
                raw: raw,
            },
        });

        return result;
    } catch (error) {
        return error;
    }
}

// Retrieve today's appointments from the database.
exports.reminderEmail = asyncHandler(async () => {

    var startDate = moment()
    switch (moment().weekday()) {
        default:
            startDate = moment().startOf("day").add(1, "days")
            break;
    }

    var queryString = {};

    queryString.AppointmentTime = {
        [Op.between]: [
            startDate.toDate(),
            startDate.add(1, "days").toDate(),
        ],
    };
    queryString.Reminded = 0;

    try {

        const schedules = await model.schedule.findAll({
            where: queryString,
            include: [
                {
                    model: model.personnel,
                },
                {
                    model: model.appointment,
                    include: [
                        {
                            model: model.personnel,
                        },
                        {
                            model: model.family,
                        },
                        {
                            model: model.child,
                            attributes: ["Name", "DoB", "Sex", "IdWithinFamily"],
                        },
                        {
                            model: model.study,
                            attributes: [
                                "StudyName",
                                "EmailTemplate",
                                "StudyType",
                                "FK_Lab",
                            ],
                            include: [
                                { model: model.lab }
                            ]
                        },
                        {
                            model: model.personnel,
                            through: { model: model.experimenterAssignment },
                            attributes: ["id", "Name", "Email", "Calendar"],
                        },
                    ],
                },
            ],
        });

        schedules.forEach(async (schedule) => {

            const credentialsPath = "api/google/general/credentials.json";
            const tokenPath = "api/google/labs/lab" + schedule.Appointments[0].Study.Lab.id + "/token.json";

            const credentials = fs.readFileSync(credentialsPath);

            const { client_secret, client_id, redirect_uris } = JSON.parse(
                credentials
            ).installed;

            const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

            const token = fs.readFileSync(tokenPath);
            oAuth2Client.setCredentials(JSON.parse(token));
            const emailContent = emailBody(schedule);

            await sendEmail(oAuth2Client, emailContent);

            // update schedule
            await model.schedule.update({ Reminded: 1 }, {
                where: { id: schedule.id }
            });
        })

        return schedules.length + " reminder email sent!"

    } catch (error) {

        throw error;
    }
});