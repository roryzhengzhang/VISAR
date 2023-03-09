import { mergeRegister } from '@lexical/utils'
import {
  lowPriority,
  SHOW_WEAKNESS_COMMAND
} from '../commands/SelfDefinedCommands'
import {
  useCallback,
  useEffect,
  forwardRef,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $isRangeSelection,
  $getNodeByKey,
  $isParagraphNode,
  $createTextNode
} from 'lexical'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Skeleton from '@mui/material/Skeleton'
import CircularProgress from '@mui/material/CircularProgress'
import Select from '@mui/material/Select'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Snackbar from '@mui/material/Snackbar'
import {
  Button,
  Grid,
  MenuItem,
  Pagination,
  Tabs,
  Tab,
  Tooltip,
  Typography
} from '@mui/material'
import { positionFloatingButton } from '../utils'
import MuiAlert from '@mui/material/Alert'
import { SHOW_LOADING_COMMAND } from '../commands/SelfDefinedCommands'
import { Container } from '@mui/system'
import { useSelector, useDispatch } from 'react-redux'
import { loadNodes, setSelectedPrompts } from '../slices/FlowSlice'
import {
  setWeaknesses,
  handleSelectedCAChanged,
  setPromptStatus,
  setFetchingAlertOpen,
  toggleWeakness,
  setFixWeaknessModalOpen,
  handleSelectedWeaknessChanged,
  resetWeaknesses
} from '../slices/EditorSlice'

const Alert = forwardRef(function Alert (props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
})

export default function WeaknessFloatGroup ({ editor }) {
  const groupRef = useRef(null)
  const dispatch = useDispatch()
  const [showPanel, setShowPanel] = useState(false)
  const itemPerPage = 5
  const weaknesses = useSelector(state => state.editor.weaknesses)
  const [page, setPage] = useState(1)
  const [isFectching, setIsFetching] = useState(false)
  const promptStatus = useSelector(state => state.editor.promptStatus)
  const curSelectedNodeKey = useSelector(
    state => state.editor.curSelectedNodeKey
  )
  const selectedWeaknesses = useSelector(
    state => state.editor.selectedWeaknesses
  )
  const [fetchingAlertOpen, setFetchingAlertOpen] = useState(false)

  const updateFloatingGroup = useCallback(() => {
    const selection = $getSelection()
    const buttonElem = groupRef.current
    const nativeSelection = window.getSelection()

    if (buttonElem === null) {
      return
    }

    const rootElement = editor.getRootElement()

    const condition =
      selection != null &&
      rootElement != null &&
      rootElement.contains(nativeSelection.anchorNode) &&
      showPanel

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

      positionFloatingButton(buttonElem, rect)
    } else {
      // console.log(`[updateFloatingGroup]: element is inactive, isElaborate: ${isElaborate}`)
      positionFloatingButton(buttonElem, null)
    }

    return true
  })

  const fetchWeaknesses = () => {
    dispatch(setPromptStatus('fetching'))
    setFetchingAlertOpen(true)

    editor.update(() => {
      const node = $getNodeByKey(curSelectedNodeKey)
      let selected_text = ''
      if (node === null) {
        const selection = $getSelection()
        selected_text = selection.getNodes()[0].getTextContent()
      } else {
        selected_text = node.getTextContent()
      }
      // IP: http://127.0.0.1:8088
      fetch('http://127.0.0.1:8088/getWeakness', {
        method: 'POST',
        mode: 'cors',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          context: selected_text
        })
      })
        .then(response => response.json())
        .then(response => {
          dispatch(setWeaknesses(response['response']))
          dispatch(setPromptStatus('fetched'))
          setPage(1)
        })
    })
  }

  useEffect(() => {
    // console.log(`isElaborate changed: ${isElaborate}`)
    editor.getEditorState().read(() => {
      updateFloatingGroup()
    })
  }, [editor, showPanel])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SHOW_WEAKNESS_COMMAND,
        () => {
          setShowPanel(true)
          dispatch(resetWeaknesses())
          fetchWeaknesses()

          return true
        },
        lowPriority
      ),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          setShowPanel(false)
          return false
        },
        lowPriority
      )
    )
  }, [editor, curSelectedNodeKey])

  const handleChipClick = (r) => {
    dispatch(handleSelectedWeaknessChanged(r))
    // console.log("selectedWeaknesses: ", selectedWeaknesses)
  }

  const handlePageChange = (event, value) => {
    setPage(value)
  }

  const handleAlertClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }

    setFetchingAlertOpen(false)
  }

  return (
    <div ref={groupRef} className='elaborate-group'>
      {isFectching ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 1
          }}
        >
          <Typography sx={{ mr: 4 }}>Looking for Weaknesses...</Typography>
          <CircularProgress size={20} />
        </Box>
      ) : (
        <Box>
          {promptStatus === 'fetching' ? (
            <Box>
              <Typography sx={{ mb: 2, mt: 2 }}>
                Looking for weakenesses...
              </Typography>
              <Skeleton animation='wave' />
              <Skeleton animation='wave' />
              <Skeleton animation='wave' />
              <Skeleton animation='wave' />

              <Snackbar
                open={fetchingAlertOpen}
                autoHideDuration={4000}
                onClose={handleAlertClose}
              >
                <Alert
                  onClose={handleAlertClose}
                  severity='success'
                  sx={{ width: '100%' }}
                >
                  Preparing weaknesses
                </Alert>
              </Snackbar>
            </Box>
          ) : (
            <Box>
              <Typography sx={{ mb: 2, mt: 2 }}>
                Potential weaknesses to be addressed:
              </Typography>
              <Box>
                <Stack spacing={1}>
                  {weaknesses.map((r, index) => {
                    if (
                      index >= (page - 1) * itemPerPage &&
                      index < page * itemPerPage
                    ) {
                      return (
                        <Tooltip title={r} key={index}>
                          <Chip
                            key={index}
                            label={r}
                            onClick={() => handleChipClick(r)}
                            color={
                              selectedWeaknesses.includes(r)
                                ? 'primary'
                                : 'default'
                            }
                          />
                        </Tooltip>
                      )
                    }
                  })}
                </Stack>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 2,
                    mt:2
                  }}
                >
                  <Pagination
                    count={Math.ceil(weaknesses.length / itemPerPage)}
                    page={page}
                    onChange={handlePageChange}
                  />
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Button
                  variant='contained'
                  sx={{
                    height: 30,
                    mt: 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 2
                  }}
                  onClick={() => {
                    dispatch(setFixWeaknessModalOpen())
                    positionFloatingButton(groupRef.current, null)
                  }}
                >
                  Address weaknesses
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </div>
  )
}
