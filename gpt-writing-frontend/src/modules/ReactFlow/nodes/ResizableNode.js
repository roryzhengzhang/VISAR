import { memo, useState } from 'react'
import { Handle, Position, useNodeId } from 'reactflow'
import { useSelector, useDispatch } from 'react-redux'
import {
  setNodeData,
  setNodeSelected,
  setDepGraphNodeAttribute,
  setCurModifiedFlowNodeKey
} from '../../LexicalEditor/slices/FlowSlice'
import {
  setCurSelectedNodeKey,
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

const ResizableNode = ({ data }) => {
  const dispatch = useDispatch()
  const avatarColors = useSelector(state => state.flow.avatarColors)
  const flowEditorNodeMapping = useSelector(
    state => state.flow.flowEditorNodeMapping
  )
  const nodeId = useNodeId()
  const [isEditing, setIsEditing] = useState(false)
  const [shiftKeyDown, isShiftKeyDown] = useState(false)
  const depGraph = useSelector(state => state.flow.dependencyGraph)
  const updateModalOpen = useSelector(state => state.editor.updateModalOpen)
  const nodeData = useSelector(state => state.flow.nodeData)

  const onFinishButtonClick = () => {
    setIsEditing(false)
    console.log("update Modal gonna be open")
    if (!updateModalOpen) {
      dispatch(setCurModifiedFlowNodeKey(nodeId))
      dispatch(setUpdateModalOpen())
    }
  }

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
              cursor: shiftKeyDown ? 'pointer' : 'auto',
              border:
                nodeData[nodeId]['selected'] === true ? 'solid green' : '',
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
              const key = flowEditorNodeMapping[nodeId]
              dispatch(setNodeSelected(key))
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
                    <Tooltip title='Edit'>
                      <IconButton onClick={() => setIsEditing(true)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
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
                          setNodeData({
                            id: nodeId,
                            data: {
                              label: event.target.value,
                              type: nodeData[nodeId].type
                            }
                          })
                        )
                      }
                      // onBlur={() => setIsEditing(false)}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          setIsEditing(false)
                        }
                      }}
                    />
                    <FormGroup
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
                    </FormGroup>
                    <Button variant='contained' onClick={onFinishButtonClick}>
                      Done
                    </Button>
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
