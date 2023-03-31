import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import Modal from '@mui/material/Modal'
import 'reactflow/dist/style.css'
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
import { useDispatch, useSelector } from 'react-redux'
import {
  setAddNodeModalOpen,
  setAddNodeModalClose
} from '../slices/EditorSlice'
import { SHOW_LOADING_COMMAND } from '../commands/SelfDefinedCommands'
import { cyan, teal, pink, amber } from '@mui/material/colors'
import { addUserDefinedFlowNode, logInteractionData } from '../slices/FlowSlice'
import Flow from './Flow'
import { ReactFlowProvider } from 'reactflow'
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Grid,
  IconButton,
  Tooltip,
  TextField,
  Button
} from '@mui/material'
import { $createHighlightDepNode } from '../nodes/HighlightDepNode'
import { $createTextBlockNode } from '../nodes/TextBlockNode'

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '40vw',
  height: '55vh',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  padding: 10,
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3
}

export default function ManualAddNodeModal () {
  const [editor] = useLexicalComposerContext()
  const dispatch = useDispatch()
  const modalOpen = useSelector(state => state.editor.addNodeModalOpen)
  const username = useSelector(state => state.editor.username)
  const sessionId = useSelector(state => state.editor.sessionId)
  const [text, setText] = useState('')
  const [prompt, setPrompt] = useState('New Node')
  const [editorNodeKey, setEditorNodeKey] = useState('')

  useEffect(() => {
    if (modalOpen) {
      editor.update(() => {
        const selection = $getSelection()
        const selectedText = selection.getTextContent()
        const node = selection.getNodes()[0]
        const curRangeNodeKey = node.__key
        setText(selectedText)
        setPrompt(selectedText)
        setEditorNodeKey(curRangeNodeKey)
      })
    }
  }, [modalOpen])

  return (
    <div>
      <Modal
        open={modalOpen}
        onClose={() => {
          dispatch(setAddNodeModalClose())
        }}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box sx={modalStyle}>
          <Typography variant='h6' sx={{ mt: 4 }}>
            Selected text
          </Typography>
          <Typography variant='body1' sx={{ mt: 4 }}>
            {text}
          </Typography>
          <Typography variant='h6' sx={{ mt: 4 }}>
            Node Prompt
          </Typography>
          <TextField
            id='edit-node-prompt'
            sx={{ minWidth: '25vw', mt: 4 }}
            value={prompt}
            onChange={event => {
              setPrompt(event.target.value)
            }}
          />
          <Box>
            <Button
              sx={{ mt: 4 }}
              variant='contained'
              onClick={() => {
                editor.update(() => {
                  const node = $getNodeByKey(editorNodeKey)
                  const textBlockNode = $createTextBlockNode()
                  const hlNode = $createHighlightDepNode(
                    'highlight-dep-elb',
                    text
                  )
                  hlNode.setStyle(`background-color: #bde0fe`)
                  textBlockNode.append(hlNode)
                  node.replace(textBlockNode)

                  dispatch(
                    addUserDefinedFlowNode({
                      editorNodeKey: hlNode.__key,
                      selectedText: text,
                      prompt: prompt
                    })
                  )

                  dispatch(
                    logInteractionData({
                      username: username,
                      sessionId: sessionId,
                      type: 'addNodeToGraph',
                      interactionData: {
                        textNodeKey: hlNode.__key,
                        content: text
                      }
                    })
                  )

                  dispatch(setAddNodeModalClose())
                })
              }}
            >
              Add Node
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  )
}
