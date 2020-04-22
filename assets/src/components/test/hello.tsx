import * as React from 'react'
import {
  onInit,
  onDidMount,
  onDidUpdate,
  onWillUnmount,
  onChange,
  useLifeState,
  onDidRender,
} from 'react-life-hooks'
import {getStore} from 'edata-store'

export default function Hello(props) {
  onInit(() => {
    console.log('this is like constructor')
  })
  onDidMount(() => {
    console.log('this is like componentDidMount')
  })
  onDidRender(() => {
    console.log('render!!', getStore().unwrap())
  })
  onDidUpdate(() => {
    console.log('this is like componentDidUpdate')
  })
  onWillUnmount(() => {
    console.log('this is like componentWillUnmount')
  })
  onChange(props, prevProps => {
    console.log('this is like componentWillReceiveProps')
  })

  // state, setState is life time, same reference in each render
  const [state, setState] = useLifeState({x: 1})
  // below have no bugs any more
  const onClick = () => {
    console.log(getStore().get('foo').value)
    getStore().getset('foo', v => ++v.value)
    setState(v => { v.x++ })
  }

  return <div>
    <span>state {state.x}</span>
    <button onClick={onClick}>Click</button>
  </div>
}
