import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import Modal from '@mui/material/Modal'
import 'reactflow/dist/style.css'
import { useDispatch, useSelector } from 'react-redux'
import {
  setUpdateModalOpen,
  setUpdateModalClose,
  resetCounterArguments,
  resetSupportingArguments,
  resetPrompts,
  handleSelectedCAChanged
} from '../slices/EditorSlice'
import { SHOW_LOADING_COMMAND } from '../commands/SelfDefinedCommands'
import { cyan, teal, pink, amber } from '@mui/material/colors'
import { $getNodeByKey } from 'lexical'
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  useViewport,
  Panel
} from 'reactflow'
import {
  onNodesChange,
  onEdgesChange,
  onConnect,
  removeNodeFromDepGraph
} from '../slices/FlowSlice'
import CustomEdge from '../../ReactFlow/edges/CustomEdge'
import Flow from './Flow'
import ResizableNode from '../../ReactFlow/nodes/ResizableNode'
import { removeNode } from '../utils'
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  Divider
} from '@mui/material'

const updateStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80vw',
  height: '90vh',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3
}

const textModuleStyle = {
  mb: 2,
  mt: 2
}

const nodeTypes = {
  customNode: ResizableNode
}

const edgeTypes = {
  customEdge: CustomEdge
}

export default function UpdateModal () {
  const [editor] = useLexicalComposerContext()
  const dispatch = useDispatch()
  const nodes = useSelector(state => state.flow.nodes)
  const edges = useSelector(state => state.flow.edges)
  const avatarColors = useSelector(state => state.flow.avatarColors)
  const modalOpen = useSelector(state => state.editor.updateModalOpen)
  const selectedPrompts = useSelector(state => state.editor.selectedPrompts)
  const depGraph = useSelector(state => state.flow.dependencyGraph)
  const nodeMappings = useSelector(state => state.flow.flowEditorNodeMapping)
  const [type, setType] = useState('CA')
  const curModifiedFlowNodeKey = useSelector(state => state.flow.curModifiedFlowNodeKey)
  const selectedCounterArguments = useSelector(state => state.editor.selectedCounterArguments)  

  useEffect(() => {
    console.log('modalOpen is changed to ' + modalOpen)
  }, [modalOpen])

  const onNodeChange = changes => {
    editor.update(() => {
      changes.forEach(change => {
        if (change.type === 'remove') {
          const editorNodeKey = nodeMappings[change.id]
          const nodeToRemove = $getNodeByKey(editorNodeKey)
          if (nodeToRemove !== null) {
            removeNode(nodeToRemove)
          }
          dispatch(removeNodeFromDepGraph(change.id))
        }
      })

      dispatch(onNodesChange(changes))
    })
  }

  useEffect(() => {
    const depNode = depGraph[curModifiedFlowNodeKey]
    if (depNode) {
      setType(depNode.type)

      
    }
  }, [])

  return (
    <div>
      <Modal
        open={modalOpen}
        onClose={() => {
          dispatch(setUpdateModalClose())
          // dispatch(resetCounterArguments())
          // dispatch(resetSupportingArguments())
          // dispatch(resetPrompts())
        }}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Grid container spacing={2} sx={updateStyle}>
          <Grid item xs={6}>
            <Stack direction='column'>
              <Typography variant='h4' sx={textModuleStyle}>
                Component info
              </Typography>
              <Typography variant='h6' sx={textModuleStyle}>
                Parent content
              </Typography>
              <Typography>dhasdhaiheiw eqw qwe rf er qreqw</Typography>
              <Typography variant='h6' sx={textModuleStyle}>
                Relationship with parent
              </Typography>
              <Typography>Supporting argument</Typography>
              <Typography variant='h6' sx={textModuleStyle}>
                Supporting evidence types
              </Typography>
              {type === 'CA' && (
                <Stack spacing={1}>
                  {["dewewq", "eqwewq sdd qwe"].map((p, index) => {
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
                  })}
                </Stack>
              )}
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                onNodesChange={onNodeChange}
                edges={edges}
                onEdgesChange={change => dispatch(onEdgesChange(change))}
                onConnect={change => dispatch(onConnect(change))}
                nodeTypes={nodeTypes}
                elementsSelectable={true}
                edgeTypes={edgeTypes}
                fitView
              >
                <Background variant='dots' gap={12} size={1} />
              </ReactFlow>
            </ReactFlowProvider>
          </Grid>
        </Grid>
      </Modal>
    </div>
  )
}
