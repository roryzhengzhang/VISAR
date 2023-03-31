import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addDependency, getDependencies } from '../neo4j'
import { useDispatch, useSelector } from 'react-redux'
import { positionFloatingButton, highlightDepText } from '../utils'
import {
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $setSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  $isParagraphNode,
  $isTextNode,
  $createRangeSelection,
  $getRoot,
  $createTextNode,
  createCommand
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import {
  ELABORATE_COMMAND,
  ADD_EXAMPLE_COMMAND,
  SHOW_DEPENDENCY_COMMAND,
  ADD_TO_GRAPH_COMMAND,
  lowPriority,
  SHOW_LOADING_COMMAND
} from '../commands/SelfDefinedCommands'
import {
  $createHighlightDepNode,
  $isHighlightDepNode
} from '../nodes/HighlightDepNode'
import { setCurRangeNodeKey } from '../slices/EditorSlice'
import { addUserDefinedFlowNode, setNodeSelected } from '../slices/FlowSlice'

export default function ControlConditionMenu ({ editor }) {
  const buttonRef = useRef(null)
  const dispatch = useDispatch()
  const nodeData = useSelector(state => state.flow.nodeData)
  const nodeMappings = useSelector(state => state.flow.flowEditorNodeMapping)
  const showDependencies = useCallback(() => {
    const selection = $getSelection()

    const node = selection.getNodes()[0]

    getDependencies(node).then(res => {
      highlightDepText(editor, res)
    })

    // highlightText(editor, selection.getTextContent(), undefined, undefined, "highlight-dep-elb")

    // console.log(`selection content: ${selection.getTextContent()}`)

    // node.setStyle(" background-color: #cdb4db; padding: 1px 0.25rem; font-family: Menlo, Consolas, Monaco, monospace; font-size: 94%; border-radius: 25px;");
  }, [editor])

  // callback updating floating button position
  const updateFloatingButton = useCallback(() => {
    // console.log("updateFloatingButton was called")

    const selection = $getSelection()
    const buttonElem = buttonRef.current
    const nativeSelection = window.getSelection()

    if (buttonElem === null) {
      return
    }

    const rootElement = editor.getRootElement()
    if (
      selection != null &&
      !nativeSelection.isCollapsed &&
      rootElement != null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const domRange = nativeSelection.getRangeAt(0)
      let rect
      if (nativeSelection.anchorNode === rootElement) {
        let inner = rootElement
        while (inner.firstElementChild != null) {
          inner = inner.firstElementChild
        }
        rect = inner.getBoundingClientReact()
      } else {
        rect = domRange.getBoundingClientRect()
      }

      positionFloatingButton(buttonElem, rect)
    } else {
      positionFloatingButton(buttonElem, null)
    }

    return true
  }, [editor])

  const fetchGPTResposne = useCallback(nodeKey => {
    const prompt = $getNodeByKey(nodeKey).getTextContent()
    editor.dispatchCommand(SHOW_LOADING_COMMAND, {show: true})
    fetch('http://34.70.132.79:8088/completion', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        prompt: prompt
      })
    })
      .then(response => response.json())
      .then(response => {

        editor.update(() => {
          const completion = response.completion
          const NewTextNode = $createTextNode(completion)
          const originalNode = $getNodeByKey(nodeKey)
          originalNode.insertAfter(NewTextNode)
          editor.dispatchCommand(SHOW_LOADING_COMMAND, {show: false})
        })
      })
  }, [])

  useEffect(() => {
    const buttonElem = buttonRef.current

    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateFloatingButton()
        })
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateFloatingButton()
          return false
        },
        lowPriority
      )
    )
  }, [editor, updateFloatingButton])

  useEffect(() => {
    editor.update(() => {
      for (const [key, value] of Object.entries(nodeMappings)) {
        const SelectedEditorNodeKey = nodeMappings[key]
        const editorNode = $getNodeByKey(SelectedEditorNodeKey)
        if (editorNode == null) {
          continue
        }
        const flowNode = nodeData[key]
        if (flowNode.selected === true) {
          // set bottom border of the node to incidate it is selected
          if ($isHighlightDepNode(editorNode)) {
            editorNode.setStyle(
              'border: dashed orange; background-color: #f9c74f;'
            )
          } else {
            editorNode.setStyle('border: dashed orange;')
          }
        } else {
          // remove bottom border
          if ($isHighlightDepNode(editorNode)) {
            editorNode.setStyle('background-color: #f9c74f;')
          } else {
            editorNode.setStyle('background-color: white;')
          }
        }
      }
    })
  }, [nodeData])

  useEffect(() => {
    // editor.getEditorState().read(() => {
    //   updateFloatingButton()
    // })
  }, [editor, updateFloatingButton])

  return (
    <div ref={buttonRef} className='floatbuttongroup'>
      <button
        className='float-item'
        onClick={() => {
          editor.update(() => {
            const selection = $getSelection()
            const node = selection.getNodes()[0]
            const curRangeNodeKey = node.getKey()
            fetchGPTResposne(curRangeNodeKey)
          })
        }}
      >
        Complete
      </button>
      {/* <button
        className='float-item'
        onClick={() => {
          editor.dispatchCommand(SHOW_DEPENDENCY_COMMAND, null)
          positionFloatingButton(buttonRef.current, null)
        }}
      >
        Show dependency
      </button> */}
    </div>
  )
}
