var express = require('express');

import { request, abort, } from 'request-promise';

const port = process.env.PORT || 1337;

const app = express();

async function incoming2outgoingPayload(payload) {
  import jsontoxml from 'jsontoxml';
  const itemsToXML = {}
  for(let i = 0; i <= payload.items.length; i++) {
    const startDate = new Date(payload.items[i].start);
    const endDate = new Date(payload.items[i].end);
    itemsToXML[`vacation-${startDate.toString()}-${endDate.toString()}`] = payload.items[i].approved == true ? true : false;
  }
  return jsontoxml(itemsToXML)
}

async function fetch(url, payload) {
  console.log("Triggering url " + url);

  body = incoming2outgoingPayload(payload);

  return request({ url: url, method: 'Post', body: body })
}

async function cancel(request) {
  return await abort(request);
}

const isValidVacationRequest = (payload) => payload.employee !== undefined && payload.items.every((item) => item["end"] > item["start"])

function index(req, res) {
  /* Employe can send a webrequest to this endpoint to request vacation.

  The request will be forwarded to internal systems to register the
  vacation. The format of the reuqest should be

  Example:
      $ curl \
          -XPOST \
          -H "Content-Type: application/json" \
          localhost:5000/vacation \
          -d '{"employee":"tom", items: [{"start": 1549381557, "end": 1549581523, "approved": true}]}'

  */
  const payload = JSON.parse(request.body);
  if (!isValidVacationRequest(payload)) {
    res.status(404).send('Invalid vacation request');
    return;
  }

  const responses = await Promise.all([
    fetch("https://api.hr-management.com/webhook", payload),
    fetch("https://api.hr-management.com/webhook", payload),
    fetch("https://api.sprintboard.com/notify", payload),
  ]);

  return notified(responses);
}

app.get('/health', function (req, res) {
  res.send('ok!');
});

app.post('/vacation', index)

function notified(responses) { return "I notifed everyone - you are ready to go on vacation 🏖" }

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
