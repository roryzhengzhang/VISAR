import { mergeRegister } from '@lexical/utils'
import {
  lowPriority,
  SHOW_COUNTER_ARGUMENT_COMMAND
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
import { loadNodes, setSelectedPrompts, insertNewGeneratedNodes } from '../slices/FlowSlice'
import {
  setWeaknessTypes,
  handleSelectedCAChanged,
  setPromptStatus,
  setCounterArguments,
  setFetchingAlertOpen,
  toggleWeaknessTypes,
  setFlowModalOpen,
  resetCounterArguments,
} from '../slices/EditorSlice'

const Alert = forwardRef(function Alert (props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant='filled' {...props} />
})

export default function CounterArgumentMenu ({ editor }) {
  const groupRef = useRef(null)
  const dispatch = useDispatch()
  const weaknessTypes = useSelector(state => state.editor.weaknessTypes)
  const selectedCounterArguments = useSelector(
    state => state.editor.selectedCounterArguments
  )
  const [showPanel, setShowPanel] = useState(false)
  const itemPerPage = 5
  const [tabValue, setTabValue] = useState(0)
  const counterArguments = useSelector(state => state.editor.counterArguments)
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
  const depGraph = useSelector(state => state.flow.dependencyGraph)
  const nodeMappings = useSelector(state => state.flow.flowEditorNodeMapping)

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

  const fetchCounterArguments = useCallback(() => {
    setIsFetching(true)
    setFetchingAlertOpen(true)

    editor.update(() => {

      let nodeKey = null
      if (curSelectedNodeKey === '') {
        const selection = $getSelection()
        nodeKey = selection.getNodes()[0].__key
      } else {
        nodeKey = curSelectedNodeKey
      }

      const node = $getNodeByKey(nodeKey)
      let selected_text = ''
      if (node === null) {
        const selection = $getSelection()
        selected_text = selection.getNodes()[0].getTextContent()
      } else {
        selected_text = node.getTextContent()
      }

      let flowKey = null

      console.log("nodeMappings: ", nodeMappings)

      for (const [key, value] of Object.entries(nodeMappings)) {
        console.log(`key: ${key}, value: ${value}`)
        if (value === nodeKey) {
          flowKey = key
          break
        }
      }

      if (flowKey === null) {
        console.log("curSelectedNodeKey: ", nodeKey)
        console.log("flowKey: ", flowKey)
      }

      let keyword
      while(depGraph[flowKey]["type"] !== "featuredBy") {
        flowKey = depGraph[flowKey]["parent"]
      }

      keyword = depGraph[flowKey]["prompt"]

      // IP: http://34.70.132.79:8088
      fetch('http://34.70.132.79:8088/counterArguments', {
        method: 'POST',
        mode: 'cors',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          context: selected_text,
          keyword: keyword
        })
      })
        .then(response => response.json())
        .then(response => {
          dispatch(setCounterArguments(response['response']))
          setIsFetching(false)
          setPage(1)
        })
    })
  }, [curSelectedNodeKey, nodeMappings])

  useEffect(() => {
    // console.log(`isElaborate changed: ${isElaborate}`)
    editor.getEditorState().read(() => {
      updateFloatingGroup()
    })
  }, [editor, showPanel])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SHOW_COUNTER_ARGUMENT_COMMAND,
        () => {
          setShowPanel(true)
          dispatch(resetCounterArguments())
          fetchCounterArguments()
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
  }, [curSelectedNodeKey, nodeMappings])

  const handlePageChange = (event, value) => {
    setPage(value)
  }

  const handleAlertClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }

    setFetchingAlertOpen(false)
  }

  const handleReviewClick = (e) => {

    editor.update(() => {
      let data = []
      const pattern = /^\d{1,2}\. (.*):/i
      for (const ca of selectedCounterArguments) {
        const match = ca.match(pattern)
        if (match !== null) {
          data.push({text: match[0].slice(0, -1), type: "CA", parent_lnode_key: curSelectedNodeKey, rel_type: "attackedBy"})
        } else {
          data.push({text: ca, type: "CA", parent_lnode_key: curSelectedNodeKey, rel_type: "attackedBy"})
        }
        
      }
  
      dispatch(insertNewGeneratedNodes(data));
      dispatch(setFlowModalOpen());
      positionFloatingButton(groupRef.current, null);
    })


    // dispatch(setPromptStatus("empty"))
  };

  return (
    <div ref={groupRef} className='elaborate-group'>
      <Box>
        <Typography sx={{ mb: 2, mt: 2 }}>
          {isFectching
            ? 'Looking for Counter Arguments...'
            : 'Counter Arguments:'}
        </Typography>

        {isFectching ? (
          <Box>
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
                Preparing counter arguments
              </Alert>
            </Snackbar>
          </Box>
        ) : (
          <Box>
            <Box>
              <Stack spacing={1}>
                {counterArguments.map((p, index) => {
                  if (
                    index >= (page - 1) * itemPerPage &&
                    index < page * itemPerPage
                  ) {
                    return (
                      <Tooltip title={p} key={index}>
                        <Chip
                          key={index}
                          label={p}
                          onClick={() => dispatch(handleSelectedCAChanged(p))}
                          color='primary'
                          variant={
                            selectedCounterArguments.includes(p)
                              ? 'primary'
                              : 'outlined'
                          }
                        />
                      </Tooltip>
                    )
                  }
                })}
              </Stack>
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
                onClick={handleReviewClick}
              >
                Review and sketch
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </div>
  )
}
