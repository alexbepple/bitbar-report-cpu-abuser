#!/usr/bin/env /usr/local/bin/node

const r = require('ramda')
const notifier = require('node-notifier')
const si = require('systeminformation')
const path = require('path')
const opn = require('opn')

const findCulprit = r.pipe(
  r.filter(
    r.where({
      state: r.equals('running'),
      pcpu: r.gt(r.__, 30)
    })
  ),
  r.sortBy(r.prop('pcpu')),
  r.last
)

const findCurrentCulprit = async () => findCulprit((await si.processes()).list)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isSthUsingLotsPower = async () => {
  const culprit1 = await findCurrentCulprit()
  if (!culprit1) return null
  await sleep(500)
  const culprit2 = await findCurrentCulprit()
  if (culprit2 && r.eqBy(r.prop('command'), culprit1, culprit2)) return culprit2
}

const openActivityMonitor = () =>
  opn('/Applications/Utilities/Activity Monitor.app', { wait: false })

const showNotification = () => {
  notifier.notify({
    title: 'Alert',
    message: "Something's using lots of power. Better check.",
    icon: path.join(__dirname, 'high-voltage-sign_26a1.png'),
    wait: true
  })
  notifier.on('click', openActivityMonitor)
}

const reportCpuAbuser = async () => {
  if (await isSthUsingLotsPower()) {
    console.log(':zap:')
    showNotification()
    return
  }
  console.log(':thumbsup:')
}

reportCpuAbuser()
