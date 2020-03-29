const asyncHandler = require("express-async-handler");

// Require google from googleapis package.
const { google } = require("googleapis");

// Require oAuth2 from our google instance.
const { OAuth2 } = google.auth;

// Create a new instance of oAuth and set our Client ID & Client Secret.
const oAuth2Client = new OAuth2(
  "374041680684-89cq4b36n7qj7pir7pietv5ei0ueku9f.apps.googleusercontent.com",
  "qPp_UQ-jAardQ2_i90K7JDes"
);

// Call the setCredentials method on our oAuth2Client instance and set our refresh token.
oAuth2Client.setCredentials({
  refresh_token:
    "1//0foDDahdC5onrCgYIARAAGA8SNwF-L9Irv4RifE8bXYkmknCP7i-puxemdheSwwMW8FrKMsbQaxWkmckUvL5xgv3rgnm92mvHIVs"
});

// Create a new calender instance.
const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

// Create a dummy event for temp uses in our calendar
// const event = {
//   summary: `Meeting with David`,
//   location: `3595 California St, San Francisco, CA 94118`,
//   description: `Meet with David to talk about the new client project and how to integrate the calendar for booking.`,
//   //   colorId: 1,
//   start: {
//     dateTime: eventStartTime,
//     timeZone: "America/Toronto"
//   },
//   end: {
//     dateTime: eventEndTime,
//     timeZone: "America/Toronto"
//   }
// };

// Check if we a busy and have an event on our calendar for the same time.
// calendar.freebusy.query(
//   {
//     resource: {
//       timeMin: eventStartTime,
//       timeMax: eventEndTime,
//       timeZone: "America/Toronto",
//       items: [{ id: "primary" }]
//     }
//   },
//   (err, res) => {
//     // Check for errors in our query and log them if they exist.
//     if (err) return console.error("Free Busy Query Error: ", err);

//     // Create an array of all events on our calendar during that time.
//     const eventArr = res.data.calendars.primary.busy;

//     // Check if event array is empty which means we are not busy
//     if (eventArr.length === 0)
//       // If we are not busy create a new calendar event.
//       return calendar.events.insert(
//         { calendarId: "primary", resource: event },
//         (err, event) => {
//           // Check for errors and log them if they exist.
//           if (err) console.error("Error Creating Calender Event:", err);
//           // Else log that the event was created.
//           console.log("Calendar event successfully created: " + event.data.id);
//         }
//       );

//     // If event array is not empty log that we are busy.
//     console.log(`Sorry I'm busy...`);
//   }
// );

// {
//     "summary": "Meeting with David and Joe",
//     "location": "McMaster University",
//     "start": {
//         "dateTime": "2020-03-19T12:00:00.000",
//         "timeZone": "America/Toronto"
//     },
//     "end": {
//         "dateTime": "2020-03-19T15:30:00.000",
//         "timeZone": "America/Toronto"
//     },
//     "status": "confirmed",
//     "attendees": [
//         {
//             "email": "g.jaeger0226@gmail.com"

//         },
//         {
//             "email": "danmei@nuralogix.ai"
//         }
//     ],
//     "sendUpdates": "all"
// }

exports.create = asyncHandler(async (req, res) => {
  const event = req.body;
  const calEvent = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
    sendUpdates: "all"
  });

  res.status(200).send(calEvent.data);
  console.log("Calendar event successfully created: " + calEvent.data.id);
});

exports.update = asyncHandler(async (req, res) => {
  const event = req.body;
  const calEvent = await calendar.events.patch({
    calendarId: "primary",
    eventId: req.params.eventId,
    resource: event,
    sendUpdates: "all"
  });
  res.status(200).send(calEvent.data);
  console.log("Calendar event successfully updated: " + calEvent.data.id);
});

exports.delete = asyncHandler(async (req, res) => {
  const calEvent = await calendar.events.delete({
    calendarId: "primary",
    eventId: req.params.eventId,
    sendUpdates: "all"
  });
  res.status(200).send(calEvent.data);
  console.log("Calendar event successfully deleted: " + calEvent.data.id);
});
