import { Button, ButtonGroup } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { lowPriority, REWRITE_COMMAND } from '../commands/SelfDefinedCommands'
import { SELECTION_CHANGE_COMMAND, $getSelection } from 'lexical'
import { useDispatch } from 'react-redux'
import { positionFloatingButton } from '../utils'
import { mergeRegister } from '@lexical/utils'
import {
  setAlternativeModalOpen,
  setRefineModalOpen
} from '../slices/EditorSlice'
import { Box } from '@mui/system'

export default function RewriteModal ({ editor }) {
  const modalRef = useRef(null)
  const dispatch = useDispatch()
  const [isRewrite, setRewrite] = useState(false)

  const updateRewriteModal = useCallback(() => {
    const selection = $getSelection()
    const modalElem = modalRef.current
    const nativeSelection = window.getSelection()

    if (modalElem === null) {
      return
    }

    const rootElement = editor.getRootElement()

    const condition =
      selection != null &&
      rootElement != null &&
      rootElement.contains(nativeSelection.anchorNode) &&
      isRewrite

    // console.log('[condition] isRewrite is ', isRewrite)
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

    return true
  }, [editor, isRewrite])

  useEffect(() => {
    console.log(`isRewrite changed: ${isRewrite}`)
    editor.update(() => {
      // const selection = $getSelection()
      // if (selection !== null) {
      //   console.log('[isRwrite is called]:')
      //   console.log(selection.getNodes()[0])
      // }

      updateRewriteModal()
    })
  }, [editor, isRewrite])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        REWRITE_COMMAND,
        () => {
          setRewrite(true)
          console.log('rewrite set to true')
          updateRewriteModal()
          return true
        },
        lowPriority
      ),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          // console.log("[rewriteModal]: selection changed")
          setRewrite(false)
          updateRewriteModal()
        },
        lowPriority
      )
    )
  })

  const handleSeeAlternatives = e => {
    dispatch(setAlternativeModalOpen())
    positionFloatingButton(modalRef.current, null)
  }

  const handleRefineWithInstructions = e => {
    dispatch(setRefineModalOpen())
    positionFloatingButton(modalRef.current, null)
  }

  return (
    <div ref={modalRef} className='floatbuttongroup'>
      <button
        variant='contained'
        className='float-item'
        sx={{ mb: 1 }}
        onClick={handleSeeAlternatives}
      >
        See Alternatives
      </button>
      <button
        variant='contained'
        className='float-item'
        onClick={handleRefineWithInstructions}
      >
        Refine With Intrsuctions
      </button>
    </div>
  )
}
