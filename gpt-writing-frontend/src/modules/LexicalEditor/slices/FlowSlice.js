import { createSlice, createAsyncThunk, current } from '@reduxjs/toolkit'
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  getOutgoers
} from 'reactflow'
import ResizableNode from '../../ReactFlow/nodes/ResizableNode'
import { cyan, teal, pink, amber, blue, purple } from '@mui/material/colors'
import { addGenerationsFromSketch } from '../utils'
import { GEN_TEXT_FROM_SKETCH_COMMAND } from '../commands/SelfDefinedCommands'
import structuredClone from '@ungap/structured-clone'

const initialState = {
  nodes: [],
  edges: [],
  selectedPrompts: [],
  flowEditorNodeMapping: {},
  nodeData: {},
  dataFetched: false,
  backendResponse: null,
  edgeData: {},
  dependentsOfModifiedNodes: [],
  curModifiedFlowNodeKey: null,
  isLazyUpdate: false,
  // record the mapping between lexical node and flow node
  avatarColors: {
    K: '#e2afff',
    A: '#bde0fe',
    DP: '#ffd60a',
    CA: '#ff758f',
    S: '#83c5be'
  },
  finalKeywords: [],
  dependencyGraph: {}
}

export const NodeEdgeTypeMapping = {
  attackedBy: 'Attacked By',
  featuredBy: 'Featured By',
  elaboratedBy: 'Elaborated By',
  supportedBy: 'Supported By'
}

export const logInteractionData = createAsyncThunk(
  'flow/logInteractionData',
  async (args, { getState }) => {

    const res = await fetch('https://visar.app/api/logInteractionData', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        username: args.username,
        sessionId: args.sessionId,
        type: args.type,
        interactionData: args.interactionData
      })
    })
  }
)

export const generateFromDepGraph = createAsyncThunk(
  'flow/generateFromDepGraph',
  async (args, { getState }) => {
    const state = getState()
    const flowEditorNodeMapping = JSON.parse(
      JSON.stringify(state.flow.flowEditorNodeMapping)
    )
    const dependencyGraph = JSON.parse(
      JSON.stringify(state.flow.dependencyGraph)
    )
    let rootKeys = []

    // Assume there is an unique root of the dependency graph, fetch the root key
    for (const [key, value] of Object.entries(dependencyGraph)) {
      if (value['type'] === 'root') {
        rootKeys.push(key)
      }
    }

    if (rootKeys.length === 0) {
      console.log('[generateFromDepGraph] rootKey is null')
      return {
        res: state.flow.dependencyGraph
      }
    }

    const res = await fetch('https://visar.app/api/generateFromDepGraph', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        dependencyGraph: dependencyGraph,
        rootKeys: rootKeys
      })
    }).then(res => res.json())

    console.log('depGraph: ', res['depGraph'])

    return {
      depGraph: res['depGraph'],
      rootFlowKeys: rootKeys,
      nodeMappings: flowEditorNodeMapping
    }
  }
)

export const generateFromSketch = createAsyncThunk(
  'flow/generateFromSketch',
  async (editor, { getState }) => {
    const state = getState()

    const res = await fetch('https://visar.app/api/generateFromSketch', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        selectedPrompts: state.flow.selectedPrompts,
        keywords: state.flow.finalKeywords,
        discussionPoints: state.flow.nodeData,
        dependencyGraph: state.flow.dependencyGraph
      })
    }).then(res => res.json())

    console.log(
      `[FlowSlice]: setCurRangeNodeKey: ${state.editor.curRangeNodeKey}`
    )

    return {
      editor: editor,
      res: res,
      curRangeNodeKey: state.editor.curRangeNodeKey
    }
  }
)

const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    incoporateFlowData (state, action) {
      const {
        newNodes,
        newEdges,
        newNodeData,
        newEdgeData,
        newDependencyGraph
      } = action.payload
      const nodes = [...state.nodes]
      const edges = [...state.edges]
      const nodeData = { ...state.nodeData }
      const edgeData = { ...state.edgeData }
      const dependencyGraph = { ...state.dependencyGraph }
      const globalNodes = nodes.push(...newNodes)
      const globalEdges = edges.push(...newEdges)
      const globalNodeData = Object.assign(nodeData, newNodeData)
      const globalEdgeData = Object.assign(edgeData, newEdgeData)
      const globalDependencyGraph = Object.assign(
        dependencyGraph,
        newDependencyGraph
      )

      return {
        ...state,
        nodes: globalNodes,
        edges: globalEdges,
        nodeData: globalNodeData,
        edgeData: globalEdgeData,
        dependencyGraph: globalDependencyGraph
      }
    },
    onNodesChange (state, action) {
      const changes = action.payload
      state.nodes = applyNodeChanges(changes, state.nodes)
    },
    onEdgesChange (state, action) {
      const changes = action.payload
      state.edges = applyEdgeChanges(changes, state.edges)
    },
    onConnect (state, action) {
      const connection = action.payload
      const id = Math.random(10000).toString()
      let edgeData = { ...state.edgeData }
      let nodeData = JSON.parse(JSON.stringify(state.nodeData))
      edgeData[id] = { type: 'elaboratedBy' }
      // update depdenency graph
      let dependencyGraph = JSON.parse(JSON.stringify(state.dependencyGraph))
      const sourceNodeKey = connection.source
      const targetNodeKey = connection.target
      if (targetNodeKey in dependencyGraph) {
        dependencyGraph[targetNodeKey]['parent'] = sourceNodeKey
        dependencyGraph[targetNodeKey]['type'] = 'elaboratedBy'
      } else {
        dependencyGraph[targetNodeKey] = {
          parent: sourceNodeKey,
          type: 'elaboratedBy',
          children: [],
          prompt: state.nodeData[targetNodeKey].data.label,
          text: state.nodeData[targetNodeKey].data.label,
          isImplemented: false
        }
      }

      dependencyGraph[sourceNodeKey]['children'].push(targetNodeKey)

      if (targetNodeKey in nodeData) {
        nodeData[targetNodeKey]['type'] = 'DP'
      } else {
        console.log('node key is not in nodeData')
      }
      return {
        ...state,
        edges: addEdge(
          {
            ...connection,
            type: 'customEdge',
            id: id,
            markerEnd: {
              type: MarkerType.ArrowClosed
            },
            style: { stroke: '#555' }
          },
          state.edges
        ),
        edgeData: edgeData,
        nodeData: nodeData,
        dependencyGraph: dependencyGraph
      }
    },
    setSelectedPrompts (state, action) {
      const prompts = action.payload
      return {
        ...state,
        selectedPrompts: prompts
      }
    },
    setIsLazyUpdate (state, action) {
      return {
        ...state,
        isLazyUpdate: action.payload
      }
    },
    removeNodeFromDepGraph (state, action) {
      let dependencyGraph = JSON.parse(JSON.stringify(state.dependencyGraph))
      let nodeMappings = JSON.parse(JSON.stringify(state.flowEditorNodeMapping))
      const delNodeKey = action.payload
      console.log("[removeNode] depGraph: ", dependencyGraph)
      console.log("[removeNode] delNodeKey", delNodeKey)

      if (dependencyGraph[delNodeKey] !== undefined) {
        const parent = dependencyGraph[delNodeKey]['parent']

        if (parent !== null && parent !== undefined) {
          const index = dependencyGraph[parent]['children'].indexOf(delNodeKey)
          dependencyGraph[parent]['children'].splice(index, 1)
        }
  
        dependencyGraph[delNodeKey]['children'].forEach( child => {
          if (dependencyGraph[child] !== undefined) {
            delete dependencyGraph[child]
          }
          if (nodeMappings[child] !== undefined) {
            delete nodeMappings[child]
          }
        })
  
        console.log("removeNodeFromDepGraph is called, del key: ", delNodeKey)
        delete dependencyGraph[delNodeKey]
      }

      return {
        ...state,
        dependencyGraph: dependencyGraph,
        flowEditorNodeMapping: nodeMappings
      }
    },
    setCurModifiedFlowNodeKey (state, action) {
      const nodeKey = action.payload
      return {
        ...state,
        curModifiedFlowNodeKey: nodeKey
      }
    },
    setDependentsOfModifiedNodes (state, action) {
      const dependents = action.payload
      return {
        ...state,
        dependentsOfModifiedNodes: dependents
      }
    },
    setFlowEditorNodeMapping (state, action) {
      const mappings = JSON.parse(JSON.stringify(state.flowEditorNodeMapping))
      const { flowKey, EditorKey } = action.payload

      console.log(
        `[setFlowEditorNodeMapping] flowKey: ${flowKey}, EditorKey: ${EditorKey}`
      )

      mappings[flowKey] = EditorKey
      return {
        ...state,
        flowEditorNodeMapping: { ...mappings }
      }
    },
    setDepGraphNodeAttribute (state, action) {
      const depGraph = JSON.parse(JSON.stringify(state.dependencyGraph))
      const { nodeKey, attribute, value } = action.payload
      if (depGraph[nodeKey] !== undefined) {
        depGraph[nodeKey][attribute] = value
        console.log(
          `[setDepGraphNodeAttribute] nodeKey ${nodeKey} updated:`,
          depGraph[nodeKey]
        )
      } else {
        console.log(`[setDepGraphNodeAttribute] nodeKey ${nodeKey} not found`)
      }

      return {
        ...state,
        dependencyGraph: { ...depGraph }
      }
    },
    extendFlowEditorNodeMapping (state, action) {
      // const { nodeKey, prompt } = action.payload
      const nodeData = { ...state.nodeData }
      const oldFlowEditorNodeMapping = JSON.parse(
        JSON.stringify(state.flowEditorNodeMapping)
      )
      const newFlowEditorNodeMapping = JSON.parse(
        JSON.stringify(action.payload)
      )

      console.log('[setFlowEditorNodeMapping] payload:')
      console.log(action.payload)

      const newMappings = Object.assign(
        oldFlowEditorNodeMapping,
        newFlowEditorNodeMapping
      )

      return {
        ...state,
        flowEditorNodeMapping: { ...newMappings }
      }
    },
    extendDepGraph (state, action) {
      // const { nodeKey, prompt } = action.payload
      const oldDepGraph = JSON.parse(JSON.stringify(state.dependencyGraph))
      const newDepGraph = JSON.parse(JSON.stringify(action.payload))

      console.log('[extendDepGraph] payload:')
      console.log(action.payload)

      const mergedGraph = Object.assign(oldDepGraph, newDepGraph)

      return {
        ...state,
        dependencyGraph: { ...mergedGraph }
      }
    },
    setNodeData (state, action) {
      const { id, data } = action.payload
      state.nodeData[id] = data
    },
    setEdgeData (state, action) {
      const { id, data } = action.payload
      state.edgeData[id] = data
    },
    setNodeSelectedUsingFlowKey: (state, action) => {
      const flowKey = action.payload
      const nodeData = JSON.parse(JSON.stringify(state.nodeData))
      for (const [key, value] of Object.entries(nodeData)) {
        if (key === flowKey) {
          value.selected = true
        } else {
          value.selected = false
        }
      }

      return {
        ...state,
        nodeData: nodeData
      }
    },
    setNodeSelected: (state, action) => {
      const nodeKey = action.payload

      const nodeData = JSON.parse(JSON.stringify(state.nodeData))

      let flowKey = ''
      for (const [key, value] of Object.entries(state.flowEditorNodeMapping)) {
        if (value === nodeKey) {
          flowKey = key
        }
      }

      for (const [key, value] of Object.entries(nodeData)) {
        if (key === flowKey) {
          value.selected = true
        } else {
          value.selected = false
        }
      }

      return {
        ...state,
        nodeData: nodeData
      }
    },
    addUserDefinedFlowNode (state, action) {
      const { editorNodeKey, selectedText, prompt } = action.payload
      const node_width = 300
      const node_height = 100
      const maxWidth = 500
      const pos_x = Math.floor(Math.random() * 600)
      const pos_y = Math.floor(Math.random() * 600)
      // console.log(viewport);
      let nodeData = { ...state.nodeData }
      let nodes = [...state.nodes]
      let depGrpah = JSON.parse(JSON.stringify(state.dependencyGraph))
      let mappings = JSON.parse(JSON.stringify(state.flowEditorNodeMapping))

      let id = 'user' + '-' + Math.random(1000).toString()
      const text = selectedText === null ? 'New Node' : selectedText
      console.log('[addUserDefinedFlowNode] text: ', text)

      nodeData[id] = { label: text, type: 'A' }

      depGrpah[id] = {
        type: 'root',
        prompt: prompt,
        isImplemented: false,
        parent: null,
        children: [],
        text: text,
        userEntered: false,
        needsUpdate: false
      }

      const newNode = {
        id: id,
        type: 'customNode',
        position: {
          x: pos_x,
          y: pos_y
        },
        data: { label: text },
        style: {
          minWidth: node_width,
          minHeight: node_height,
          maxWidth: maxWidth
        }
      }
      nodes.push(newNode)

      if (editorNodeKey !== null) {
        mappings[id] = editorNodeKey
        console.log(
          '[addUserDefinedFlowNode] flowKey: ',
          id,
          ' editorNodeKey: ',
          editorNodeKey
        )
      } else {
        mappings[id] = undefined
      }

      return {
        ...state,
        nodeData: { ...nodeData },
        nodes: [...nodes],
        dependencyGraph: { ...depGrpah },
        flowEditorNodeMapping: { ...mappings }
      }
    },
    setNodeDataAttribute (state, action) {
      const { nodeKey, attribute, value } = action.payload
      const nodeData = JSON.parse(JSON.stringify(state.nodeData))
      if (nodeData[nodeKey] !== undefined) {
        nodeData[nodeKey][attribute] = value
      } else {
        console.log('nodeData is undefined')
      }
      return {
        ...state,
        nodeData: { ...nodeData }
      }
    },
    insertNewGeneratedNodes (state, action) {
      const newData = action.payload
      let nodeData = JSON.parse(JSON.stringify(state.nodeData))
      let edgeData = JSON.parse(JSON.stringify(state.edgeData))
      let flowEditorNodeMapping = JSON.parse(
        JSON.stringify(state.flowEditorNodeMapping)
      )
      let dependencyGraph = JSON.parse(JSON.stringify(state.dependencyGraph))
      const node_width = 300
      const node_height = 100
      const maxWidth = 500
      let nodes = [...state.nodes]
      let edges = [...state.edges]

      // set the isNewAdded attrribute to true for all the old nodes
      for (const [key, value] of Object.entries(nodeData)) {
        nodeData[key].isNewAdded = false
      }

      if (newData instanceof Array) {
        // find the corresponding flow node for the given parent lexical text node

        for (const data of newData) {
          let randId = Math.floor(Math.random() * 10000)

          let { text, parent_lnode_key, type, rel_type } = data

          console.log(
            `[InsertNewGeneratedNodes]: text: ${text}, parent_lnode_key: ${parent_lnode_key}, type: ${type}, randId: ${randId}`
          )

          let parentKey = null
          for (const [rid, lkey] of Object.entries(flowEditorNodeMapping)) {
            if (lkey === parent_lnode_key) {
              parentKey = rid
            }
          }

          const parentNode = nodes.filter(n => n['id'] === parentKey)[0]

          const newNodeKey = type + '-' + randId

          if (parentNode) {
            // console.log(`Found parent node in graph: ${matched_rid}`)

            const siblings = getOutgoers(parentNode, nodes, edges)
            const num_siblings = siblings.length

            // console.log('parentNode', current(parentNode))

            const parent_pos = parentNode['position']
            const pos = {
              x: parent_pos['x'] + node_width * num_siblings + 50,
              y: parent_pos['y'] + 300
            }
            // Make sure the node id is unique

            nodeData[newNodeKey] = {
              id: type + '-' + randId,
              label: text,
              type: type,
              pos: pos,
              isNewAdded: true
            }

            edgeData[newNodeKey + '-edge'] = {
              type: rel_type
            }

            nodes.push({
              id: newNodeKey,
              type: 'customNode',
              data: { label: text },
              position: pos,
              parentNode: parentNode['id'],
              style: {
                minWidth: node_width,
                minHeight: node_height,
                maxWidth: maxWidth
              }
            })

            dependencyGraph[newNodeKey] = {
              type: rel_type,
              prompt: text,
              isImplemented: false,
              parent: parentKey,
              children: [],
              needsUpdate: false
            }

            dependencyGraph[parentKey]['children'].push(newNodeKey)

            edges.push({
              id: newNodeKey + '-edge',
              source: parentNode['id'],
              target: type + '-' + randId,
              sourceHandle: 'bottom',
              type: 'customEdge',
              markerEnd: {
                type: MarkerType.ArrowClosed
              },
              style: { stroke: '#555' },
              label: rel_type,
              data: {
                type: rel_type
              }
            })
          } else {
            console.log(
              `Did not found matched parent node in graph: ${parent_lnode_key}`
            )
            continue
          }
        }
      }

      return {
        ...state,
        nodes: nodes,
        edges: edges,
        nodeData: nodeData,
        edgeData: edgeData,
        dependencyGraph: { ...dependencyGraph }
      }
    },
    loadNodes (state, action) {
      // init nodes from the selected discussion points
      const {
        selectedText,
        selectedKeywords,
        discussionPoints,
        curRangeNodeKey
      } = action.payload
      let new_nodes = [...state.nodes]
      let new_edges = [...state.edges]
      const node_width = 300
      const node_height = 100
      const maxWidth = 500
      let dependencyGraph = JSON.parse(JSON.stringify(state.dependencyGraph))
      const randId = Math.floor(Math.random() * 1000)
      const flowEditorNodeMapping = JSON.parse(
        JSON.stringify(state.flowEditorNodeMapping)
      )

      let nodeData = JSON.parse(JSON.stringify(state.nodeData))
      let edgeData = JSON.parse(JSON.stringify(state.edgeData))

      let keyPointMappings = {}
      selectedKeywords.map((k, index) => {
        keyPointMappings[k] = discussionPoints.filter(r => r['keyword'] === k)
      })

      const init_x = 150
      const init_y = 150

      let root_key = null
      for (const [key, value] of Object.entries(flowEditorNodeMapping)) {
        if (value === curRangeNodeKey) {
          root_key = key
        }
      }

      if (root_key === null) {
        root_key = 'user' + '-' + randId
        dependencyGraph[root_key] = {
          type: 'root',
          prompt: '',
          parent: null,
          children: [],
          text: selectedText,
          isImplemented: true,
          userEntered: true,
          needsUpdate: false
        }

        // Assume the current selected node is the root node
        flowEditorNodeMapping[root_key] = curRangeNodeKey

        nodeData[root_key] = {
          id: root_key,
          label: selectedText,
          type: 'A',
          pos: { init_x, init_y },
          isNewAdded: true
        }

        new_nodes.push({
          id: root_key,
          type: 'customNode',
          data: { label: selectedText },
          position: { x: init_x, y: init_y },
          style: {
            minWidth: node_width,
            minHeight: node_height,
            maxWidth: maxWidth
          }
        })
      }

      selectedKeywords.map((k, windex) => {
        const parent_x = 500 * (windex % 2)
        const parent_y = 400 * Math.floor(windex / 2) + 300

        const keyword_key = 'keyword' + '-' + randId + '-' + k

        nodeData[keyword_key] = {
          id: keyword_key,
          label: k,
          type: 'K',
          pos: { parent_x, parent_y },
          isNewAdded: true
        }

        new_nodes.push({
          id: keyword_key,
          type: 'customNode',
          data: { label: k },
          position: { x: parent_x, y: parent_y },
          parentNode: root_key,
          style: {
            minWidth: node_width,
            minHeight: node_height,
            maxWidth: maxWidth
          }
        })

        dependencyGraph[keyword_key] = {
          type: 'featuredBy',
          prompt: k,
          isImplemented: false,
          parent: root_key,
          children: [],
          needsUpdate: false
        }

        dependencyGraph[root_key]['children'].push(keyword_key)

        edgeData['init' + '-' + randId + '-' + k + '-edge'] = {
          type: 'featuredBy'
        }

        new_edges.push({
          id: 'init' + '-' + randId + '-' + k + '-edge',
          source: root_key,
          target: keyword_key,
          sourceHandle: 'bottom',
          type: 'customEdge',
          markerEnd: {
            type: MarkerType.ArrowClosed
          },
          style: { stroke: '#555' },
          label: 'featuredBy',
          data: {
            type: 'featuredBy'
          }
        })

        keyPointMappings[k].map((p, pindex) => {
          const num_children = keyPointMappings[k].length
          const pos_x =
            parent_x + (node_width + 100) * pindex - (num_children * 400) / 2
          const pos_y = parent_y + 300

          const dp_key = 'dp' + '-' + randId + '-' + k + '-' + pindex

          nodeData[dp_key] = {
            id: dp_key,
            label: p['prompt'],
            type: 'DP',
            pos: { pos_x, pos_y },
            isNewAdded: true
          }

          dependencyGraph[dp_key] = {
            type: 'elaboratedBy',
            prompt: p['prompt'],
            children: [],
            isImplemented: false,
            children: [],
            parent: keyword_key,
            needsUpdate: false
          }

          dependencyGraph[keyword_key]['children'].push(dp_key)

          new_nodes.push({
            id: dp_key,
            type: 'customNode',
            data: { label: p['prompt'] },
            parentNode: keyword_key,
            position: {
              x: pos_x,
              y: pos_y
            },
            style: {
              minWidth: node_width,
              minHeight: node_height,
              maxWidth: maxWidth
            }
          })

          edgeData[randId + '-' + k + '-' + pindex + '-edge'] = {
            type: 'elaboratedBy'
          }

          new_edges.push({
            id: randId + '-' + k + '-' + pindex + '-edge',
            source: keyword_key,
            target: dp_key,
            sourceHandle: 'bottom',
            type: 'customEdge',
            markerEnd: {
              type: MarkerType.ArrowClosed
            },
            style: { stroke: '#555' },
            label: 'elaboratedBy',
            data: {
              type: 'elaboratedBy'
            }
          })
        })
      })

      return {
        ...state,
        nodes: [...new_nodes],
        edges: [...new_edges],
        nodeData: { ...nodeData },
        edgeData: { ...edgeData },
        finalKeywords: selectedKeywords,
        selectedPrompts: selectedText,
        dependencyGraph: { ...dependencyGraph },
        flowEditorNodeMapping: { ...flowEditorNodeMapping }
      }
    }
  },
  extraReducers: {
    [generateFromSketch.pending]: (state, action) => {
      state.dataFetched = false
    },
    [generateFromSketch.fulfilled]: (state, action) => {
      const { editor, res, curRangeNodeKey } = action.payload
      let response = {
        ...res
      }

      return {
        ...state,
        backendResponse: response,
        dataFetched: true
      }

      // console.log("[flowSlice] res:")
      // console.log(res)

      // editor.update(() => {
      //   editor.dispatchCommand(GEN_TEXT_FROM_SKETCH_COMMAND, response)
      // })
    },
    [generateFromDepGraph.fulfilled]: (state, action) => {
      const { depGraph } = action.payload

      return {
        ...state,
        dependencyGraph: JSON.parse(JSON.stringify(depGraph))
      }
    }
  }
})

export const {
  onNodesChange,
  onEdgesChange,
  onConnect,
  loadNodes,
  setSelectedPrompts,
  addNode,
  setNodeData,
  setEdgeData,
  extendFlowEditorNodeMapping,
  insertNewGeneratedNodes,
  addUserDefinedFlowNode,
  extendDepGraph,
  removeNodeFromDepGraph,
  setNodeSelected,
  setFlowEditorNodeMapping,
  setDepGraphNodeAttribute,
  setNodeDataAttribute,
  setNodeSelectedUsingFlowKey,
  setCurModifiedFlowNodeKey,
  setDependentsOfModifiedNodes,
  setIsLazyUpdate
} = flowSlice.actions

export default flowSlice.reducer
