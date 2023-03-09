import Modal from '@mui/material/Modal'
import {
  generateRewrite,
  setCurSelectedNodeKey,
  setFixWeaknessModalClose,
  resetWeaknesses
} from '../slices/EditorSlice'
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  IconButton
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { $getNodeByKey } from 'lexical'
import CircularProgress from '@mui/material/CircularProgress'
import { $isHighlightDepNode } from '../nodes/HighlightDepNode'
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { setNodeSelected } from '../slices/FlowSlice'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 1000,
  height: 800,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4
}

export default function FixWeaknessModal () {
  const [editor] = useLexicalComposerContext()
  const dispatch = useDispatch()
  const modalOpen = useSelector(state => state.editor.fixWeaknessModalOpen)
  const selectedSent = useSelector(state => state.editor.selectedSent)
  const curSelectedNodeKey = useSelector(
    state => state.editor.curSelectedNodeKey
  )
  const [fetchStatus, setFetchStatus] = useState('init')
  const candidates = useSelector(state => state.editor.alterantives)
  const [instruction, setInstruction] = useState('')
  const selectedWeaknesses = useSelector(
    state => state.editor.selectedWeaknesses
  )
  const [initLoading, setInitLoading] = useState(true)

  const handleReplaceButtonClicked = useCallback((e, index) => {
    const text = candidates[index]

    editor.update(() => {
      const curSelectedNode = $getNodeByKey(curSelectedNodeKey)
      curSelectedNode.setTextContent(text)
      dispatch(setFixWeaknessModalClose())
      dispatch(setCurSelectedNodeKey(''))
      dispatch(setNodeSelected(''))
      setFetchStatus('init')
    })
  })

  useEffect(() => {
    console.log('[FixWeaknessModal] modalOpen:', modalOpen)

    if (!modalOpen) {
      setInitLoading(true)
      setInstruction("")
    }

    if (modalOpen) {
      setFetchStatus('loading')
      let prompt = ''
      editor.update(() => {
        const node = $getNodeByKey(curSelectedNodeKey)
        if ($isHighlightDepNode(node)) {
          console.log('node is highlight dep node, key: ', curSelectedNodeKey)
          console.log(node)
          prompt = node.getPrompt()
          console.log('node prompt: ', prompt)
        } else {
          console.log("node isn't highlight dep node")
          prompt = node.getText()
        }
      })

      dispatch(
        generateRewrite({
          basePrompt: prompt,
          curSent: selectedSent,
          mode: 'fix',
          weaknesses: selectedWeaknesses
        })
      ).then(() => {
        setFetchStatus('loaded')
        setInitLoading(false)
      })
    }
  }, [modalOpen])

  const handleGenerateButtonClicked = useCallback(() => {
    let prompt = ''
    editor.update(() => {
      const node = $getNodeByKey(curSelectedNodeKey)
      if ($isHighlightDepNode(node)) {
        setFetchStatus('loading')
        console.log('node is highlight dep node, key: ', curSelectedNodeKey)
        console.log(node)
        prompt = node.getPrompt()
        console.log('node prompt: ', prompt)

        dispatch(
          generateRewrite({
            basePrompt: prompt,
            curSent: selectedSent,
            mode: 'refine',
            furInstruction: instruction
          })
        ).then(() => {
          setFetchStatus('loaded')
        })
      }
    })
  })

  return (
    <div>
      <Modal
        open={modalOpen}
        onClose={() => {
          dispatch(setFixWeaknessModalClose())
          dispatch(resetWeaknesses())
        }}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box sx={style}>
          <Box sx={{ mb: 4 }}>
            <Typography variant='h6'>Current sentence: </Typography>
            <Typography sx={{ overflow: 'auto', maxHeight: 200 }}>
              {selectedSent}
            </Typography>
          </Box>
          {!initLoading && (
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}
            >
              <TextField
                id='instruction-id'
                label='Instruction for refinement'
                variant='outlined'
                value={instruction}
                onChange={event => {
                  setInstruction(event.target.value)
                }}
                sx={{ width: '78%' }}
              />
              <Button variant='contained' onClick={handleGenerateButtonClicked}>
                Generate
              </Button>
            </Box>
          )}
          {fetchStatus === 'loading' ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <CircularProgress />
            </Box>
          ) : fetchStatus === 'loaded' ? (
            <Box>
              <Typography variant='h6'>Alternatives: </Typography>
              <List style={{ overflow: 'auto', maxHeight: 400 }}>
                {candidates.map((candidate, index) => {
                  return (
                    <ListItem>
                      <ListItemText>{candidate}</ListItemText>
                      <IconButton
                        onClick={e => handleReplaceButtonClicked(e, index)}
                      >
                        <PublishedWithChangesIcon />
                      </IconButton>
                    </ListItem>
                  )
                })}
              </List>
            </Box>
          ) : (
            <Box></Box>
          )}
        </Box>
      </Modal>
    </div>
  )
}
