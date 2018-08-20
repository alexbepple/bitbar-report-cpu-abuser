#!/usr/bin/env /usr/local/bin/node

const r = require("ramda");
const notifier = require("node-notifier");
const si = require("systeminformation");

const findCulprit = r.pipe(
  r.filter(
    r.where({
      state: r.equals("running"),
      pcpu: r.gt(r.__, 30)
    })
  ),
  r.sortBy(r.prop("pcpu")),
  r.last
);

const findCurrentCulprit = async () => findCulprit((await si.processes()).list);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const culprit1 = await findCurrentCulprit();
  if (!culprit1) {
    console.log("All good!");
    return;
  }

  await sleep(500);

  const culprit2 = await findCurrentCulprit();
  if (culprit2 && r.eqBy(r.prop("command"), culprit1, culprit2)) {
    console.log("Something's using lots of power.");
    notifier.notify("Something's using lots of power. Better check.");
    return;
  }

  console.log("All good!");
})();
