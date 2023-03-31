import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addDependency, getDependencies } from '../neo4j'
import { useDispatch, useSelector } from 'react-redux'
import {
  positionFloatingButton,
  highlightDepText,
  removeNode,
  colorMapping
} from '../utils'
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
  createCommand,
  KEY_BACKSPACE_COMMAND,
  KEY_ENTER_COMMAND,
  INSERT_LINE_BREAK_COMMAND
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import {
  ELABORATE_COMMAND,
  ADD_EXAMPLE_COMMAND,
  SHOW_DEPENDENCY_COMMAND,
  ADD_TO_GRAPH_COMMAND,
  lowPriority,
  highPriority
} from '../commands/SelfDefinedCommands'
import {
  $createHighlightDepNode,
  $isHighlightDepNode
} from '../nodes/HighlightDepNode'
import {
  setCurRangeNodeKey,
  setAddNodeModalOpen,
  setCurSelection,
  setCurSelectedNodeKey
} from '../slices/EditorSlice'
import {
  addUserDefinedFlowNode,
  setNodeSelected,
  removeNodeFromDepGraph,
  logInteractionData
} from '../slices/FlowSlice'

export function FloatingMenu ({ editor }) {
  const buttonRef = useRef(null)
  const dispatch = useDispatch()
  const username = useSelector(state => state.editor.username)
  const sessionId = useSelector(state => state.editor.sessionId)
  const nodeData = useSelector(state => state.flow.nodeData)
  const nodeMappings = useSelector(state => state.flow.flowEditorNodeMapping)
  const dependencyGraph = useSelector(state => state.flow.dependencyGraph)
  const curClickedNodeKey = useSelector(state => state.editor.curClickedNodeKey)

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

  useEffect(() => {
    const buttonElem = buttonRef.current

    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateFloatingButton()
        })
      }),

      editor.registerCommand(
        KEY_ENTER_COMMAND,
        event => {
          const curClickeddNode = $getNodeByKey(curClickedNodeKey)
          if (
            curClickedNodeKey !== '' &&
            $isHighlightDepNode(curClickeddNode)
          ) {
            editor.setEditable(false)
            return true
          }

          console.log(
            '[KEY_ENTER_COMMAND] curSelectedNodeKey: ',
            curClickedNodeKey
          )

          return false
        },
        highPriority
      ),

      editor.registerCommand(
        INSERT_LINE_BREAK_COMMAND,
        () => {
          console.log('INSERT_LINE_BREAK_COMMAND was called')
        },
        lowPriority
      ),

      editor.registerCommand(
        ADD_TO_GRAPH_COMMAND,
        () => {
          dispatch(setAddNodeModalOpen())
          return true
        },
        lowPriority
      ),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateFloatingButton()
          return false
        },
        lowPriority
      ),

      editor.registerCommand(
        SHOW_DEPENDENCY_COMMAND,
        () => {
          showDependencies()

          positionFloatingButton(buttonElem, null)
          return true
        },
        lowPriority
      )
    )
  }, [editor, updateFloatingButton, curClickedNodeKey])

  useEffect(() => {
    editor.update(() => {
      for (const [key, value] of Object.entries(nodeMappings)) {
        const SelectedEditorNodeKey = nodeMappings[key]
        const editorNode = $getNodeByKey(SelectedEditorNodeKey)
        const depData = dependencyGraph[key]
        if (editorNode == null) {
          continue
        }
        const flowNode = nodeData[key]
        console.log("curNode['type']: ", depData['type'])
        if (flowNode.selected === true) {
          // set bottom border of the node to incidate it is selected
          if (
            $isHighlightDepNode(editorNode) &&
            depData['userEntered'] === true
          ) {
            editorNode.setStyle(
              'border: dashed green; background-color: #bde0fe;'
            )
          } else if ($isHighlightDepNode(editorNode)) {
            if (depData['type'] === 'root') {
              editorNode.setStyle(
                `border: dashed green; background-color: ${colorMapping['root']};`
              )
            } else if (depData['type'] === 'featuredBy') {
              editorNode.setStyle(
                `border: dashed green; background-color: ${colorMapping['featuredBy']};`
              )
            } else if (depData['type'] === 'elaboratedBy') {
              editorNode.setStyle(
                `border: dashed green; background-color: ${colorMapping['elaboratedBy']};`
              )
            } else if (depData['type'] === 'attackedBy') {
              editorNode.setStyle(
                `border: dashed green; background-color: ${colorMapping['attackedBy']};`
              )
            } else if (depData['type'] === 'supportedBy') {
              editorNode.setStyle(
                `border: dashed green; background-color: ${colorMapping['supportedBy']};`
              )
            } else {
              editorNode.setStyle(
                `border: dashed green; background-color:  #f9c74f;`
              )
            }
          } else {
            console.log(`editorNode ${SelectedEditorNodeKey} is not a hl node`)
            editorNode.setStyle('border: dashed green;')
          }
        } else {
          // remove bottom border
          if (
            $isHighlightDepNode(editorNode) &&
            depData['userEntered'] === true
          ) {
            editorNode.setStyle('background-color: #bde0fe;')
          } else if ($isHighlightDepNode(editorNode)) {
            if (depData['type'] === 'root') {
              editorNode.setStyle(`background-color: ${colorMapping['root']};`)
            } else if (depData['type'] === 'featuredBy') {
              editorNode.setStyle(
                `background-color: ${colorMapping['featuredBy']};`
              )
            } else if (depData['type'] === 'elaboratedBy') {
              editorNode.setStyle(
                `background-color: ${colorMapping['elaboratedBy']};`
              )
            } else if (depData['type'] === 'attackedBy') {
              editorNode.setStyle(
                `background-color: ${colorMapping['attackedBy']};`
              )
            } else if (depData['type'] === 'supportedBy') {
              editorNode.setStyle(
                `background-color: ${colorMapping['supportedBy']};`
              )
            } else {
              editorNode.setStyle(`background-color:  #f9c74f;`)
            }
          } else {
            console.log(`editorNode ${SelectedEditorNodeKey} is not a hl node`)
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
            dispatch(setCurRangeNodeKey(curRangeNodeKey))
            dispatch(setNodeSelected(curRangeNodeKey))
            dispatch(setCurSelection(selection.getTextContent()))

            editor.dispatchCommand(ELABORATE_COMMAND, null)
            positionFloatingButton(buttonRef.current, null)

            dispatch(
              logInteractionData({
                username: username,
                sessionId: sessionId,
                type: 'elaborate',
                interactionData: {
                  textNodeKey: curRangeNodeKey,
                  content: selection.getTextContent()
                }
              })
            )
          })
        }}
      >
        Elaborate
      </button>
      <button
        className='float-item'
        onClick={() => {
          editor.dispatchCommand(ADD_TO_GRAPH_COMMAND, null)
          positionFloatingButton(buttonRef.current, null)
        }}
      >
        Add to graph
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
