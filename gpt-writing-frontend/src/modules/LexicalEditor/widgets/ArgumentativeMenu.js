import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addDependency, getDependencies } from '../neo4j'
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
import {
  mergeRegister,
  removeClassNamesFromElement,
  addClassNamesToElement
} from '@lexical/utils'
import {
  ELABORATE_COMMAND,
  ADD_EXAMPLE_COMMAND,
  REWRITE_COMMAND,
  SHOW_WEAKNESS_COMMAND,
  SHOW_SUPPORT_COMMAND,
  SHOW_DEPENDENCY_COMMAND,
  SHOW_COUNTER_ARGUMENT_COMMAND,
  lowPriority,
  highPriority,
  EVIDENCE_COMMAND,
  ARGUMENTATIVE_COMMAND
} from '../commands/SelfDefinedCommands'
import { $createHighlightDepNode } from '../nodes/HighlightDepNode'
import { $isTextBlockNode } from '../nodes/TextBlockNode'
import { $isHighlightDepNode } from '../nodes/HighlightDepNode'
import {
  resetSupportingArguments,
  setCurSelectedNodeKey,
  setIsCurNodeEditable,
  setSelectedSent
} from '../slices/EditorSlice'
import { useDispatch, useSelector } from 'react-redux'
import { setNodeSelected, logInteractionData } from '../slices/FlowSlice'
import { Divider } from '@mui/material'
import { Stack } from '@mui/system'

export function ArgumentativeMenu ({ editor }) {
  const buttonRef = useRef(null)
  const dispatch = useDispatch()
  const nodeData = useSelector(state => state.flow.nodeData)
  const [isMenuOpen, setMenuOpen] = useState(false)
  const curSelectedNodeKey = useSelector(
    state => state.editor.curSelectedNodeKey
  )
  const isCurNodeEditable = useSelector(state => state.editor.isCurNodeEditable)

  const username = useSelector(state => state.editor.username)
  const sessionId = useSelector(state => state.editor.sessionId)

  // const showDependencies = useCallback(() => {
  //   const selection = $getSelection()

  //   const node = selection.getNodes()[0]

  //   getDependencies(node).then(res => {
  //     highlightDepText(editor, res)
  //   })

  //   // highlightText(editor, selection.getTextContent(), undefined, undefined, "highlight-dep-elb")

  //   // console.log(`selection content: ${selection.getTextContent()}`)

  //   // node.setStyle(" background-color: #cdb4db; padding: 1px 0.25rem; font-family: Menlo, Consolas, Monaco, monospace; font-size: 94%; border-radius: 25px;");
  // }, [editor])

  // callback updating floating button position
  const updateArgumentativeMenu = useCallback(() => {
    const selection = $getSelection()
    const modalElem = buttonRef.current
    const nativeSelection = window.getSelection()

    if (modalElem === null) {
      return
    }

    const rootElement = editor.getRootElement()

    const condition =
      selection != null &&
      rootElement != null &&
      rootElement.contains(nativeSelection.anchorNode) &&
      isMenuOpen

    // console.log('[condition] isMenuOpen is ', isMenuOpen)
    // console.log('Whole condition is ', condition)

    if (condition) {
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

      console.log('show rewrite modal')
      positionFloatingButton(modalElem, rect)
    } else {
      // console.log(`[updateFloatingGroup]: element is inactive, isElaborate: ${isElaborate}`)
      positionFloatingButton(modalElem, null)
    }

    console.log('updateArgumentativeMenu called')

    return true
  }, [editor, isMenuOpen])

  useEffect(() => {
    const buttonElem = buttonRef.current

    // editor.getEditorState().read(() => {
    //   positionFloatingButton(buttonElem, null)
    // })

    return mergeRegister(
      editor.registerCommand(
        ARGUMENTATIVE_COMMAND,
        () => {
          setMenuOpen(true)
          console.log('rewrite set to true')
          updateArgumentativeMenu()
          return true
        },
        lowPriority
      ),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          // console.log("[rewriteModal]: selection changed")
          setMenuOpen(false)
          updateArgumentativeMenu()
        },
        lowPriority
      )
    )
  }, [editor, updateArgumentativeMenu])

  useEffect(() => {
    editor.update(() => {
      updateArgumentativeMenu()
    })
  }, [editor, isMenuOpen])

  // useEffect(() => {
  //   editor.update(() => {
  //     console.log("[textblock menu] nodedata changed changed")
  //     updateTextBlockMenu()
  //   })
  // }, [isCurNodeEditable])

  return (
    <div className='floatbuttongroup' ref={buttonRef} sx={{ display: 'flex' }}>
      <button
        className='float-item'
        onClick={() => {
          editor.update(() => {
            const selection = $getSelection()
            const nodes = selection.getNodes()
            const node = nodes[0]
            console.log(
              '[counter argument button] current node key:',
              node.__key
            )
            dispatch(setCurSelectedNodeKey(node.__key))
            dispatch(setNodeSelected(node.__key))
            editor.dispatchCommand(SHOW_COUNTER_ARGUMENT_COMMAND, null)
            positionFloatingButton(buttonRef.current, null)

            dispatch(
              logInteractionData({
                username: username,
                sessionId: sessionId,
                type: 'counterArgument',
                interactionData: {
                  textNodeKey: node.__key,
                  oldContent: node.getTextContent()
                }
              })
            )
          })
        }}
      >
        Counter Arguments
      </button>
      <Divider orientation='vertical' />
      <button
        className='float-item'
        onClick={() => {
          editor.update(() => {
            const selection = $getSelection()
            const nodes = selection.getNodes()
            const node = nodes[0]
            console.log('[weaknesses button] current node key:', node.__key)
            dispatch(setCurSelectedNodeKey(node.__key))
            editor.dispatchCommand(SHOW_WEAKNESS_COMMAND, null)
            positionFloatingButton(buttonRef.current, null)

            dispatch(
              logInteractionData({
                username: username,
                sessionId: sessionId,
                type: 'logicalWeakness',
                interactionData: {
                  textNodeKey: node.__key,
                  oldContent: node.getTextContent()
                }
              })
            )
          })
        }}
      >
        Logical weaknesses
      </button>
      <Divider orientation='vertical' />
      <button
        className='float-item'
        onClick={() => {
          editor.update(() => {
            const selection = $getSelection()
            const nodes = selection.getNodes()
            const node = nodes[0]
            dispatch(setCurSelectedNodeKey(node.__key))
            editor.dispatchCommand(SHOW_SUPPORT_COMMAND, null)
            positionFloatingButton(buttonRef.current, null)

            dispatch(
              logInteractionData({
                username: username,
                sessionId: sessionId,
                type: 'supportingEvidence',
                interactionData: {
                  textNodeKey: node.__key,
                  oldContent: node.getTextContent()
                }
              })
            )
          })
        }}
      >
        Supporting evidences
      </button>
    </div>
  )
}
