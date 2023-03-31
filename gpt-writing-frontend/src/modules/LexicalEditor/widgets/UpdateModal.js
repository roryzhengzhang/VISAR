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
import LoopIcon from '@mui/icons-material/Loop'
import { $createTextNode, $getNodeByKey, $isTextNode, $getRoot } from 'lexical'
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
  removeNodeFromDepGraph,
  setDependentsOfModifiedNodes,
  setCurModifiedFlowNodeKey,
  setDepGraphNodeAttribute,
  setNodeSelectedUsingFlowKey,
  setNodeDataAttribute,
  setFlowEditorNodeMapping
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
  Tooltip,
  Chip,
  Divider,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft'
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight'
import { $createHighlightDepNode } from '../nodes/HighlightDepNode'
import { $createTextBlockNode } from '../nodes/TextBlockNode'
import { colorMapping } from '../utils'


const updateStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  height: '95vh',
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
  const [type, setType] = useState('')
  const [newText, setNewText] = useState('')
  const [chips, setChips] = useState([])
  const [curNodeKey, setCurNodeKey] = useState(null)
  const [isInitNode, setIsInitNode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [optionLoading, setOptionLoading] = useState(false)
  const [sortedDependents, setSortedDependents] = useState([])
  const [selectedChip, setSelectedChip] = useState('')
  const [alertOpen, setAlertOpen] = useState(false)
  const [showGeneration, setShowGeneration] = useState(false)
  const curModifiedFlowNodeKey = useSelector(
    state => state.flow.curModifiedFlowNodeKey
  )
  const selectedCounterArguments = useSelector(
    state => state.editor.selectedCounterArguments
  )
  const flowEditorNodeMapping = useSelector(
    state => state.flow.flowEditorNodeMapping
  )

  const edgeTypeMappings = {
    featuredBy:
      'A feature/aspect that expands the argument of the parent node.',
    supportedBy: 'Support argument for parent node',
    elaboratedBy: 'Discussion points for elaborating on parent node',
    attackedBy: 'Counter argument for parent node'
  }

  const title = {
    featuredBy: 'New feature/aspect',
    supportedBy: 'New supporting argument type',
    elaboratedBy: 'New discussion points',
    attackedBy: 'New counter argument type'
  }

  const handleChipSelected = c => {
    const chip = c
    if (chip !== selectedChip) {
      setSelectedChip(chip)
    }
  }

  const ShowAlert = () => {
    console.log('show alert')
    setAlertOpen(true)
    setTimeout(() => {
      setAlertOpen(false)
    }, 1000)
  }

  const getSortedDependents = nodeKey => {
    const node = depGraph[nodeKey]
    let visited = []
    let queue = []
    let sortedDependents = [nodeKey]
    queue.push(nodeKey)
    while (queue.length > 0) {
      const curNodeKey = queue.shift()
      if (!visited.includes(curNodeKey)) {
        visited.push(curNodeKey)
        const curNode = depGraph[curNodeKey]
        if (curNode === undefined || curNode === null)  {
          continue
        }
        if (curNode['children']) {
          console.log('chidlren: ', curNode['children'])
          const dependents = curNode['children']
          dependents.forEach(d => {
            queue.push(d)
            sortedDependents.push(d)
          })
        }
      }
    }

    console.log('sortedDependents: ', sortedDependents)
    return sortedDependents
  }

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

  const generateOptions = nodeKey => {
    const depNode = depGraph[nodeKey]
    if (depNode) {
      const parent = depNode.parent
      let params = null
      let endpoint = null
      console.log('dep node: ', depNode)
      setOptionLoading(true)
      if (depNode.type === 'featuredBy') {
        params = {
          prompt: depGraph[parent]['text']
        }
        endpoint = 'keyword'
      } else if (depNode.type === 'supportedBy') {
        params = {
          context: depGraph[parent]['text']
        }
        endpoint = 'supportingArguments'
      } else if (depNode.type === 'elaboratedBy') {
        params = {
          context: depGraph[parent]['text'],
          keywords: [depGraph[parent]['prompt']]
        }
        endpoint = 'prompts'
      } else if (depNode.type === 'attackedBy') {
        params = {
          context: depGraph[parent]['text'],
          keyword: depGraph[parent]['prompt']
        }
        endpoint = 'counterArguments'
      } else {
        return
      }

      fetch(`http://34.70.132.79:8088/${endpoint}`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(params)
      })
        .then(res => res.json())
        .then(res => {
          const response = res['response']
          let prompt = []

          console.log('response:', response)

          if (endpoint === 'prompts') {
            const tmp = response.filter(
              p => p['keyword'] === depGraph[parent]['prompt']
            )
            tmp.forEach(t => {
              prompt.push(t['prompt'])
            })
          } else {
            prompt = response
          }

          if (response) {
            setChips(prompt)
            setOptionLoading(false)
            setShowGeneration(false)
          }
        })
    }
  }

  const insertTextToEditor = (nodeKey, text) => {
    // Assume the correponding editor node doesn't exist
    if (depGraph[nodeKey]['parent'] !== null) {
      const parent = depGraph[nodeKey]['parent']
      const curNode = depGraph[nodeKey]
      const parentEditorNodeKey = nodeMappings[parent]
      const parentNode = $getNodeByKey(parentEditorNodeKey)
      if (parentNode !== null) {
        const hlNode = $createHighlightDepNode('highlight-dep-elb', text)
        hlNode.setStyle(`background-color: ${colorMapping[curNode['type']]}`)
        const spaceNode = $createTextNode(' ')
        // Add a new textBlock Node
        const textBlockNode = $createTextBlockNode()

        switch (curNode['type']) {
          case 'featuredBy':
            // get parent node
            textBlockNode.append(hlNode)
            if ($isTextNode(parentNode)) {
              parentNode.insertAfter(textBlockNode)
              textBlockNode.append(spaceNode)
            } else {
              parentNode.append(textBlockNode)
              parentNode.append(spaceNode)
            }
            break
          case 'elaboratedBy':
            if ($isTextNode(parentNode)) {
              parentNode.insertAfter(hlNode)
              hlNode.insertAfter(spaceNode)
            } else {
              parentNode.append(hlNode)
              parentNode.append(spaceNode)
            }

            break
          case 'attackedBy':
            if ($isTextNode(parentNode)) {
              parentNode.insertAfter(hlNode)
              hlNode.insertAfter(spaceNode)
            } else {
              parentNode.append(hlNode)
              parentNode.append(spaceNode)
            }
            break
          case 'root':
            console.log("[insertTextToEditor] type is root")
            const root = $getRoot()
            root.append(hlNode)
            root.append(spaceNode)
            break
          default:
            if ($isTextNode(parentNode)) {
              parentNode.insertAfter(hlNode)
              hlNode.insertAfter(spaceNode)
            } else {
              parentNode.append(hlNode)
              parentNode.append(spaceNode)
            }
        }
        console.log("new editor's parent node: ", parentEditorNodeKey)
        console.log('new editor node: ', hlNode.__key)
        // Add to nodeMappings
        dispatch(
          setFlowEditorNodeMapping({
            flowKey: nodeKey,
            EditorKey: hlNode.getKey()
          })
        )
      }
    } else {
      const hlNode = $createHighlightDepNode('highlight-dep-elb', text)
      hlNode.setStyle(`background-color: ${colorMapping['root']}`)
      const spaceNode = $createTextNode(' ')
      // Add a new textBlock Node
      const textBlockNode = $createTextBlockNode()
      textBlockNode.append(hlNode)
      textBlockNode.append(spaceNode)
      console.log("[insertTextToEditor] type is root")
      const root = $getRoot()
      root.append(textBlockNode)

      dispatch(
        setFlowEditorNodeMapping({
          flowKey: nodeKey,
          EditorKey: hlNode.getKey()
        })
      )
    }
  }

  const implementNode = (nodeKey, newPrompt) => {
    console.log('newPrompt: ', newPrompt)

    const depNode = depGraph[nodeKey]
    if (depNode && modalOpen) {
      const parent = depNode.parent
      let params = null
      let endpoint = null
      setLoading(true)
      console.log('updated node paret: ', parent)
      if (depNode.type === 'attackedBy') {
        params = {
          context: depGraph[parent]['text'],
          prompt: newPrompt
        }
        endpoint = 'implementCounterArgument'
      } else if (depNode.type === 'supportedBy') {
        params = {
          context: depGraph[parent]['text'],
          prompt: newPrompt
        }
        endpoint = 'implementSupportingArgument'
      } else if (depNode.type === 'elaboratedBy') {
        params = {
          context: depGraph[parent]['text'],
          prompt: newPrompt
        }
        endpoint = 'implementElaboration'
      } else if (depNode.type === 'featuredBy') {
        params = {
          prompt: newPrompt,
          context: depGraph[parent]['text']
        }
        endpoint = 'implementKeyword'
      } else if (depNode.type === "root") {
        params = {
          prompt: newPrompt,
          // context: depGraph[parent]['text']
        }
        endpoint = 'implementTopicSentence'
      } else {
        console.log("[Attention] unknown type for node implementation")
        return
      }

      console.log("[implementation] params: ", params)

      fetch(`http://34.70.132.79:8088/${endpoint}`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(params)
      })
        .then(res => res.json())
        .then(res => {
          const response = res['response']
          setNewText(response)
          setLoading(false)
          if (isInitNode) {
            setShowGeneration(true)
          }
        })
    }
  }

  useEffect(() => {
    if (modalOpen) {
      setType(depGraph[curModifiedFlowNodeKey]['type'])
      setCurNodeKey(curModifiedFlowNodeKey)
      const sortedDependents = getSortedDependents(curModifiedFlowNodeKey)
      setSortedDependents(sortedDependents)
      dispatch(setDependentsOfModifiedNodes(sortedDependents))
      console.log("curModifiedFlowNodeKey: ", curModifiedFlowNodeKey)
      console.log("depGraph: ", depGraph)
      implementNode(
        curModifiedFlowNodeKey,
        depGraph[curModifiedFlowNodeKey]['prompt']
      )
    }
  }, [modalOpen])

  // useEffect(() => {
  //   if (curNodeKey && !isInitNode) {
  //     generateOptions(curNodeKey)
  //   }
  // }, [curNodeKey])

  // useEffect(() => {
  //   if (showGeneration && !isInitNode) {
  //     implementNode(curNodeKey)
  //   }
  // }, [showGeneration])

  return (
    <div>
      <Modal
        open={modalOpen}
        onClose={() => {
          dispatch(setUpdateModalClose())
          dispatch(setCurModifiedFlowNodeKey(''))
          dispatch(setDependentsOfModifiedNodes([]))
          setIsInitNode(true)
          // dispatch(resetCounterArguments())
          // dispatch(resetSupportingArguments())
          // dispatch(resetPrompts())
        }}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Grid container spacing={2} sx={updateStyle}>
          <Grid item xs={6} sx={{ maxHeight: '95%' }}>
            <Stack direction='column'>
              <Typography variant='h4' sx={textModuleStyle}>
                Node information
              </Typography>
              <Box sx={{ height: '100%', maxHeight: '100%' }}>
                {modalOpen &&
                  curNodeKey in depGraph &&
                  depGraph[curNodeKey]['parent'] && (
                    <Box>
                      <Typography variant='h6' sx={textModuleStyle}>
                        Parent content
                      </Typography>
                      <Typography style={{ maxHeight: 80, overflow: 'auto' }}>
                        {modalOpen &&
                          curNodeKey in depGraph &&
                          depGraph[depGraph[curNodeKey]['parent']]['text']}
                      </Typography>
                    </Box>
                  )}
                <Typography variant='h6' sx={textModuleStyle}>
                  Relationship with parent
                </Typography>
                <Typography>
                  {modalOpen &&
                    curNodeKey in depGraph &&
                    edgeTypeMappings[depGraph[curNodeKey]['type']]}
                </Typography>
                <Typography variant='h6' sx={textModuleStyle}>
                  {modalOpen &&
                    curNodeKey in depGraph &&
                    !isInitNode &&
                    title[depGraph[curNodeKey]['type']]}
                </Typography>
                {optionLoading && <CircularProgress />}
                {!isInitNode && !optionLoading && (
                  <Stack
                    spacing={1}
                    style={{ maxHeight: 200, overflowY: 'auto' }}
                  >
                    {chips.map((p, index) => {
                      return (
                        <Tooltip title={p} key={index}>
                          <Chip
                            key={index}
                            label={p}
                            onClick={() => {
                              handleChipSelected(p)
                            }}
                            color='primary'
                            variant={
                              p === selectedChip ? 'primary' : 'outlined'
                            }
                          />
                        </Tooltip>
                      )
                    })}
                  </Stack>
                )}
                {!isInitNode && !optionLoading && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Button
                      variant='contained'
                      sx={{ mt: 2, mb: 2 }}
                      onClick={() => {
                        console.log(
                          'genearating text, selected chip: ',
                          selectedChip
                        )
                        dispatch(
                          setNodeDataAttribute({
                            nodeKey: curNodeKey,
                            attribute: 'label',
                            value: selectedChip
                          })
                        )
                        dispatch(
                          setDepGraphNodeAttribute({
                            nodeKey: curNodeKey,
                            attribute: 'prompt',
                            value: selectedChip
                          })
                        )
                        implementNode(curNodeKey, selectedChip)
                        setShowGeneration(true)
                      }}
                    >
                      Generate text
                    </Button>
                  </Box>
                )}
                {showGeneration && (
                  <Typography variant='h6' sx={textModuleStyle}>
                    Updated text
                  </Typography>
                )}

                {loading && <CircularProgress />}
                {!loading && showGeneration && (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Box sx={{ maxHeight: 100, overflowY: 'auto'}}>
                      <Typography
                        sx={{
                          color: 'green'
                        }}
                      >
                        {newText}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mt: 2
                      }}
                    >
                      <Button
                        variant='outlined'
                        onClick={() => {
                          if (!isInitNode) {
                            implementNode(curNodeKey, selectedChip)
                          } else {
                            implementNode(
                              curNodeKey,
                              depGraph[curNodeKey]['prompt']
                            )
                          }
                        }}
                        sx={{ mr: 6 }}
                      >
                        Regenerate
                      </Button>
                      {nodeMappings[curNodeKey] !== undefined &&
                      nodeMappings[curNodeKey] !== null ? (
                        <Button
                          variant='outlined'
                          onClick={() => {
                            dispatch(
                              setDepGraphNodeAttribute({
                                nodeKey: curNodeKey,
                                attribute: 'text',
                                value: newText
                              })
                            )
                            let EditorNodeKey = null
                            console.log(
                              'curNodeKey is in nodeMappings',
                              curNodeKey in nodeMappings
                            )
                            console.log(
                              'editorNodeKey: ',
                              flowEditorNodeMapping[curNodeKey]
                            )
                            EditorNodeKey = flowEditorNodeMapping[curNodeKey]

                            if (EditorNodeKey !== null) {
                              editor.update(() => {
                                const node = $getNodeByKey(EditorNodeKey)
                                node.setTextContent(newText)
                              })
                              ShowAlert()
                            }
                          }}
                        >
                          Replace text
                        </Button>
                      ) : (
                        <Button
                          variant='outlined'
                          onClick={() => {
                            dispatch(
                              setDepGraphNodeAttribute({
                                nodeKey: curNodeKey,
                                attribute: 'text',
                                value: newText
                              })
                            )
                            dispatch(
                              setDepGraphNodeAttribute({
                                nodeKey: curNodeKey,
                                attribute: 'isImplemented',
                                value: true
                              })
                            )
                            editor.update(() => {
                              insertTextToEditor(curNodeKey, newText)
                            })
                            ShowAlert()
                          }}
                        >
                          Add text to editor
                        </Button>
                      )}
                    </Box>
                    {alertOpen && (
                      <Alert sx={{ mt: 2 }} severity='success'>
                        Text updated!
                      </Alert>
                    )}
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Typography sx={{ mt: 1 }}>Prev dependent</Typography>
                <IconButton
                  sx={{ mr: 10 }}
                  {...(sortedDependents.indexOf(curNodeKey) === 0 && {
                    disabled: true
                  })}
                  onClick={() => {
                    const curIndex = sortedDependents.indexOf(curNodeKey)
                    if (curIndex > 0) {
                      const newKey = sortedDependents[curIndex - 1]
                      setCurNodeKey(newKey)
                      if (newKey !== curModifiedFlowNodeKey || !isInitNode) {
                        generateOptions(newKey)
                        setIsInitNode(false)
                      }
                      dispatch(setNodeSelectedUsingFlowKey(newKey))
                      setShowGeneration(false)
                    }
                  }}
                >
                  <ArrowCircleLeftIcon />
                </IconButton>
                {/* <Typography sx={{ mr: 10, mt: 1 }}>Dependents</Typography> */}
                <IconButton
                  {...(sortedDependents.indexOf(curNodeKey) ===
                    sortedDependents.length - 1 && {
                    disabled: true
                  })}
                  onClick={() => {
                    const curIndex = sortedDependents.indexOf(curNodeKey)
                    if (curIndex < sortedDependents.length - 1) {
                      const newKey = sortedDependents[curIndex + 1]
                      setCurNodeKey(newKey)
                      if (newKey !== curModifiedFlowNodeKey) {
                        generateOptions(newKey)
                        setIsInitNode(false)
                      }
                      dispatch(setNodeSelectedUsingFlowKey(newKey))

                      setShowGeneration(false)
                    }
                  }}
                >
                  <ArrowCircleRightIcon />
                </IconButton>
                <Typography sx={{ mt: 1 }}>Next dependent</Typography>
              </Box>
              {/* <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <Button variant='contained'>Done</Button>
              </Box> */}
            </Stack>
          </Grid>
          <Grid item xs={6} sx={{ maxHeight: '95%' }}>
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
