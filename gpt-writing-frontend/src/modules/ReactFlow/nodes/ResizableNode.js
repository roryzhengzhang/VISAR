import { memo, useState, useEffect } from 'react'
import { Handle, Position, useNodeId } from 'reactflow'
import { useSelector, useDispatch } from 'react-redux'
import {
  setNodeData,
  setNodeSelected,
  setDepGraphNodeAttribute,
  setCurModifiedFlowNodeKey,
  setNodeDataAttribute,
  logInteractionData,
} from '../../LexicalEditor/slices/FlowSlice'
import {
  setCurSelectedNodeKey,
  setIsReactFlowInModal,
  setUpdateModalOpen
} from '../../LexicalEditor/slices/EditorSlice'
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Grid,
  IconButton,
  Tooltip,
  TextField
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { NodeResizer } from '@reactflow/node-resizer'
import { cyan, teal, pink, amber } from '@mui/material/colors'
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom'
import '@reactflow/node-resizer/dist/style.css'
import { selectTextNodeByKey } from '../../LexicalEditor/utils'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'
import LoopIcon from '@mui/icons-material/Loop'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

const ResizableNode = ({ data }) => {
  const [editor] = useLexicalComposerContext()
  const dispatch = useDispatch()
  const avatarColors = useSelector(state => state.flow.avatarColors)
  const flowEditorNodeMapping = useSelector(
    state => state.flow.flowEditorNodeMapping
  )
  const nodeId = useNodeId()
  const [isEditing, setIsEditing] = useState(false)
  const [shiftKeyDown, isShiftKeyDown] = useState(false)
  const [oldText, setOldText] = useState('')
  const depGraph = useSelector(state => state.flow.dependencyGraph)
  const updateModalOpen = useSelector(state => state.editor.updateModalOpen)
  const nodeData = useSelector(state => state.flow.nodeData)
  const curModifiedFlowNodeKey = useSelector(
    state => state.flow.curModifiedFlowNodeKey
  )
  const username = useSelector(state => state.editor.username)
  const sessionId = useSelector(state => state.editor.sessionId)
  const sortedDependents = useSelector(
    state => state.flow.dependentsOfModifiedNodes
  )
  const isReactFlowInModal = useSelector(
    state => state.editor.isReactFlowInModal
  )
  const isLazyUpdate = useSelector(state => state.flow.isLazyUpdate)

  const onFinishButtonClick = () => {
    setIsEditing(false)
    console.log('update Modal gonna be open')

    dispatch(
      setDepGraphNodeAttribute({
        nodeKey: nodeId,
        attribute: 'prompt',
        value: nodeData[nodeId].label
      })
    )
    dispatch(
      logInteractionData({
        username: username,
        sessionId: sessionId,
        type: "node-text-update",
        interactionData: {
          nodeId: nodeId,
          newText: nodeData[nodeId].label,
          oldText: oldText
        }
      })
    )
    setOldText(nodeData[nodeId].label)

    if (!updateModalOpen && isLazyUpdate === false) {
      dispatch(setCurModifiedFlowNodeKey(nodeId))
      if (isReactFlowInModal === false) {
        dispatch(setUpdateModalOpen())
      }
    }

  }

  useEffect(() => {
    setOldText(nodeData[nodeId].label)
  })

  // useEffect(() => {
  //   console.log("sortedDependents changed", sortedDependents)
  //   console.log("nodeId", nodeId)
  // }, [sortedDependents])

  const handleUpdateSwitchChange = event => {
    dispatch(
      setDepGraphNodeAttribute({
        nodeKey: nodeId,
        attribute: 'needsUpdate',
        value: event.target.checked
      })
    )
  }

  return (
    <div>
      {nodeId in depGraph && (
        <>
          <Handle type='target' id='top' position={Position.Top} />
          <div
            tabIndex='0'
            style={{
              padding: 10,
              // cursor: shiftKeyDown ? 'pointer' : 'auto',
              cursor: 'pointer',
              border:
                nodeData[nodeId]['selected'] === true
                  ? 'solid green'
                  : sortedDependents.includes(nodeId)
                  ? 'solid yellow'
                  : '',
              borderRadius: 4,
              borderWidth: 5
            }}
            onKeyDown={e => {
              if (e.shiftKey) {
                console.log('shift key down')
                isShiftKeyDown(true)
              }
            }}
            onKeyUp={e => {
              if (!e.shiftKey) {
                isShiftKeyDown(false)
              }
            }}
            onClick={e => {
              if (!updateModalOpen) {
                const key = flowEditorNodeMapping[nodeId]
                dispatch(setNodeSelected(key))
                console.log(`node ${nodeId} selected`)
              }
              editor.setEditable(false)
            }}
          >
            <Box style={{ alignItems: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Avatar
                  style={{ width: 30, height: 30, fontSize: 18 }}
                  sx={{ bgcolor: avatarColors[nodeData[nodeId].type] }}
                >
                  {nodeData[nodeId].type}
                </Avatar>
                {depGraph[nodeId].isImplemented === false ? (
                  <HourglassBottomIcon />
                ) : depGraph[nodeId].needsUpdate === true ? (
                  <LoopIcon />
                ) : (
                  <CheckCircleOutlineIcon />
                )}
              </Box>
              <Box
                style={{
                  textAlign: 'center',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: 40,
                  marginRight: 40,
                  marginBottom: 20
                }}
              >
                {!isEditing ? (
                  <Box>
                    <Typography variant='body1' style={{ fontSize: 20 }}>
                      {nodeData[nodeId].label}
                    </Typography>
                    {!updateModalOpen && (
                      <Tooltip title='Edit'>
                        <IconButton onClick={() => setIsEditing(true)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <TextField
                      id='edit-node-text'
                      style={{
                        minWidth: 300
                      }}
                      value={nodeData[nodeId].label}
                      onChange={event =>
                        dispatch(
                          setNodeDataAttribute({
                            nodeKey: nodeId,
                            attribute: 'label',
                            value: event.target.value
                          })
                        )
                      }
                      // onBlur={() => setIsEditing(false)}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          setIsEditing(false)
                          console.log('update Modal gonna be open')
                          dispatch(
                            setDepGraphNodeAttribute({
                              nodeKey: nodeId,
                              attribute: 'prompt',
                              value: nodeData[nodeId].label
                            })
                          )
                          if (!updateModalOpen && isLazyUpdate === false) {
                            dispatch(setCurModifiedFlowNodeKey(nodeId))
                            dispatch(setUpdateModalOpen())
                          }
                        }
                      }}
                    />
                    {/* <FormGroup
                      sx={{
                        mt: 2,
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'cneter',
                        alignItems: 'center'
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            disabled={
                              nodeId in depGraph &&
                              !depGraph[nodeId].isImplemented
                            }
                            checked={depGraph[nodeId].needsUpdate}
                            onChange={handleUpdateSwitchChange}
                          />
                        }
                        label='Update generation'
                      />
                    </FormGroup> */}
                    <Box
                      sx={{
                        mt: 2,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Button variant='contained' onClick={onFinishButtonClick}>
                        Done
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </div>
          <Handle type='source' id='bottom' position={Position.Bottom} />
          {/* <Handle type="source" id="right" position={Position.Right} /> */}
        </>
      )}
    </div>
  )
}

export default memo(ResizableNode)
