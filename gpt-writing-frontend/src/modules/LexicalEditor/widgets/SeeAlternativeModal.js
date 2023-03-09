import Modal from '@mui/material/Modal'
import {
  generateRewrite,
  setAlternativeModalClose,
  setCurSelectedNodeKey
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
import AutorenewIcon from '@mui/icons-material/Autorenew'
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

export default function SeeAlternativeModal () {
  const [editor] = useLexicalComposerContext()
  const dispatch = useDispatch()
  const modalOpen = useSelector(state => state.editor.alternativeModalOpen)
  const selectedSent = useSelector(state => state.editor.selectedSent)
  const curSelectedNodeKey = useSelector(
    state => state.editor.curSelectedNodeKey
  )
  const [fetching, setFetching] = useState(false)
  const candidates = useSelector(state => state.editor.alterantives)

  const handleRegenerateButtonClicked = useCallback(() => {
    setFetching(true)
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
        mode: 'alternative',
        furInstruction: ''
      })
    ).then(() => {
      setFetching(false)
    })
  })

  useEffect(() => {
    if (modalOpen) {
      setFetching(true)
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
          mode: 'alternative',
          furInstruction: ''
        })
      ).then(() => {
        setFetching(false)
      })
    }
  }, [modalOpen])

  const handleReplaceButtonClicked = useCallback((e, index) => {
    const text = candidates[index]

    editor.update(() => {
      const curSelectedNode = $getNodeByKey(curSelectedNodeKey)
      curSelectedNode.setTextContent(text)
      dispatch(setAlternativeModalClose())
      dispatch(setCurSelectedNodeKey(''))
      dispatch(setNodeSelected(''))
    })
  })

  return (
    <div>
      <Modal
        open={modalOpen}
        onClose={() => dispatch(setAlternativeModalClose())}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box sx={style}>
          <Box sx={{ mb: 4 }}>
            <Typography variant='h6'>Current sentence: </Typography>
            <Typography sx={{ overflow: "auto", maxHeight: 200 }}>{selectedSent}</Typography>
          </Box>
          {fetching ? (
            <Box sx={{ display: 'flex', justifyContent: "center", alignContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ maxHeight: "70%" }}>
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
              <Box sx={{ display: "flex", justifyContent: "center", alignContent: "center", mt: 6 }}>
                <IconButton color="primary" size="large" onClick={handleRegenerateButtonClicked}>
                  <AutorenewIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
    </div>
  )
}
