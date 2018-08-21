import r from 'ramda'

export const props = {
  name: 'name',
  state: 'state',
  percentCpu: 'pcpu'
}
export const get = r.map(r.prop, props)

export const isRunning = r.pipe(
  get.state,
  r.equals('running')
)
