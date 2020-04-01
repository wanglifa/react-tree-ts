import * as React from "react";
import {createContext, useContext, useRef, useState} from "react";
import './tree.css'
import {ChangeEventHandler} from "react";
interface SourceItem {
  text: string;
  value: string;
  children?: SourceItem[];
}
interface Context {
  selected: string[];
}
interface Init {
  onChange: (str: string[]) => void;
  selected: string[];
}
interface Prop extends Init{
  sourceData: SourceItem[];
}
interface RecursiveArray<T> extends Array<T | RecursiveArray<T>>{}
const C = createContext<Context | null>(null)

const DeepTree: React.FC<{item: SourceItem, level: number, onChangeItem: (values: string[]) => void}> = (props) => {
  const {item, level} = props
  const [expanded, setExpanded] = useState(true)
  const { selected } = useContext<any>(C)
  const onClickCollapse = () => { setExpanded(!expanded) }
  const checked = selected.indexOf(item.value) >= 0
  const inputRef = useRef<HTMLInputElement>(null)
  const collectChildrenValues = (item: SourceItem): any => {
    return flatten(item.children?.map(i => [i.value, collectChildrenValues(i)].filter(Boolean)))
  }
  const flatten = (arr?: RecursiveArray<string>): string[] => {
    if (!arr) return []
    return arr.reduce<string[]>((result, current) =>
      result.concat(typeof current === 'string' ? current : flatten(current)), [])
  }
  const onChangeBox: ChangeEventHandler<HTMLInputElement> = (e) => {
    const childValues = collectChildrenValues(item)
    if (e.target.checked) {
      props.onChangeItem([...selected, item.value, ...childValues].filter(Boolean))
    } else {
      props.onChangeItem(selected.filter((i: string) => i !== item.value && childValues.indexOf(i) < 0))
    }
  }
  function commonArr<T>(array1: T[], array2: T[]): T[] {
    const arr: T[] = []
    for (let i = 0; i < array1.length; i++) {
      if (array2.indexOf(array1[i]) >= 0) {
        arr.push(array1[i])
      }
    }
    return arr
  }
  const onChangeItem = (values: string[]) => {
    // 这里的values就是每次选中的元素
    const childrenValues = collectChildrenValues(item)
    // 每次选中的元素和当前元素下的子元素进行共同元素比较
    const common = commonArr(values, childrenValues)
    if (common.length !== 0) {
      props.onChangeItem(Array.from(new Set(values.concat(item.value))))
      if (common.length === childrenValues.length) {
        inputRef.current!.indeterminate = false
      } else {
        inputRef.current!.indeterminate = true
      }
    } else {
      props.onChangeItem(values.filter(v => v !== item.value))
      inputRef.current!.indeterminate = false
    }
  }
  return (
    <div key={item.value} style={{marginLeft: level === 0 ? '0' : '1em'}}>
      {
        item.children ?
          <span className={"icons"}>
            {!expanded ? <span onClick={onClickCollapse}>+</span> : <span onClick={onClickCollapse}>-</span>}
          </span> : <span className={"icons"}></span>
      }
      <input type="checkbox" onChange={(e) => onChangeBox(e)} checked={checked} ref={inputRef}/>
      <span style={{overflow: expanded ? 'block' : 'none'}}>{item.text}</span>
      <div>
        {
          expanded && item.children?.map(i =>
            <DeepTree item={i} level={level + 1} key={i.value} onChangeItem={onChangeItem}/>
          )
        }
      </div>
    </div>
  )
}
const Tree: React.FC<Prop> = (props) => {
  const {sourceData} = props
  const onChangeItem = (values: string[]) => {
    props.onChange(Array.from(new Set(values)))
  }
  return (
    <C.Provider value={{selected: props.selected}}>
      {sourceData.map(item => <DeepTree item={item} level={0} key={item.value} onChangeItem={onChangeItem}/>)}
    </C.Provider>
  )

}
export default Tree;