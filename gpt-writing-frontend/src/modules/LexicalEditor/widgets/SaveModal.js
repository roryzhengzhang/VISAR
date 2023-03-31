import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import Modal from '@mui/material/Modal'
import 'reactflow/dist/style.css'
import { useDispatch, useSelector } from 'react-redux'
import { setSaveModalClose } from '../slices/EditorSlice'
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Grid,
  IconButton,
  Tooltip,
  TextField,
  Button,
} from '@mui/material'
import { $createHighlightDepNode } from '../nodes/HighlightDepNode'
import saveIcon from '../images/icons/success_icon.svg'

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '25vw',
  height: '15vh',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  padding: 10,
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3
}

export default function SaveModal () {
  const [editor] = useLexicalComposerContext()
  const dispatch = useDispatch()
  const modalOpen = useSelector(state => state.editor.saveModalOpen)

  return (
    <div>
      <Modal
        open={modalOpen}
        onClose={() => {
          dispatch(setSaveModalClose())
        }}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box sx={modalStyle}>
          <Stack direction="column" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box
              sx={{
                width: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <img
                style={{ maxWidth: '100%', maxHeight: '100%' }}
                src={saveIcon}
              ></img>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <Typography variant='h6'>
                Your draft has been saved successfully!
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Modal>
    </div>
  )
}
