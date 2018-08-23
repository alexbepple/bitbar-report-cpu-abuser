#!/usr/bin/env /usr/local/bin/node --experimental-modules --no-warnings

import r from 'ramda'
import notifier from 'node-notifier'
import si from 'systeminformation'
import path from 'path'
import opn from 'opn'
import * as pT from './process-type'

// Treat the whitelist with care, as it means no abuse detection at all.
const whitelist = ['bztransmit']

const findCulprit = r.pipe(
  r.filter(
    r.both(pT.isRunning, r.where({ [pT.props.percentCpu]: r.gt(r.__, 70) }))
  ),
  r.reject(r.where({ [pT.props.name]: r.contains(r.__, whitelist) })),
  r.sortBy(pT.get.percentCpu),
  r.last
)

const findCurrentCulprit = async () => findCulprit((await si.processes()).list)

const ms = r.identity
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getCulprit = async () => {
  const culprit1 = await findCurrentCulprit()
  if (!culprit1) return null
  await sleep(ms(1000))
  const culprit2 = await findCurrentCulprit()
  if (culprit2 && r.eqBy(r.prop('command'), culprit1, culprit2)) return culprit2
}

const openActivityMonitor = () =>
  opn('/Applications/Utilities/Activity Monitor.app', { wait: false })

const getAbsolutePathForAsset = (relativePath) => {
  const __dirname = path.dirname(new URL(import.meta.url).pathname)
  return path.join(__dirname, 'high-voltage-sign_26a1.png')
}

const reportViaNotification = (culprit) => {
  notifier.notify({
    title: 'CPU Usage Alert',
    message: `${pT.get.name(culprit)} is using lots of power.`,
    icon: getAbsolutePathForAsset('high-voltage-sign_26a1.png'),
    wait: true
  })
  notifier.on('click', openActivityMonitor)
}

const showInMenubar = console.log

const reportInMenubar = (culprit) =>
  showInMenubar(`:zap:${pT.get.name(culprit)}:zap:`)

const reportCpuAbuser = async () => {
  const culprit = await getCulprit()
  if (culprit) {
    reportInMenubar(culprit)
    reportViaNotification(culprit)
    return
  }
  showInMenubar('.')
}

reportCpuAbuser()
