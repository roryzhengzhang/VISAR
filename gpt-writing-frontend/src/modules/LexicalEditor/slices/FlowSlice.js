import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from "reactflow";
import ResizableNode from "../../ReactFlow/nodes/ResizableNode";
import { cyan, teal, pink, amber } from '@mui/material/colors';

const initialState = {
  nodes: [],
  edges: [],
  selectedPrompts: [],
  nodeData: {},
  edgeData: {},
  avatarColors: {
    K: pink[200],
    A: cyan[200],
    DP: amber[300]
  },
  finalKeywords: [],
};

const generateFromSketch = createAsyncThunk(
  "flow/generateFromSketch",
  async (arg, { getState }) => {
    const state = getState();

    const res = await fetch("http://localhost:8088/generateFromSketch", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        selectedPrompts: state.flow.selectedPrompts,
        keywords: state.flow.finalKeywords,
        discussionPoints: state.flow.nodeData,
      })
    })
  }
);

const flowSlice = createSlice({
  name: "flow",
  initialState,
  reducers: {
    onNodesChange(state, action) {
      const changes = action.payload;
      state.nodes = applyNodeChanges(changes, state.nodes);
    },
    onEdgesChange(state, action) {
      const changes = action.payload;
      state.edges = applyEdgeChanges(changes, state.edges);
    },
    onConnect(state, action) {
      const connection = action.payload;
      const id  = Math.random(1000).toString();
      let edgeData = { ...state.edgeData };
      edgeData[id] ={ type: "includes" }
      return {
        ...state,
        edges: addEdge({...connection, type: "customEdge", id: id}, state.edges),
        edgeData: edgeData
      }
    },
    setSelectedPrompts(state, action) {
      const prompts = action.payload;
      return {
        ...state,
        selectedPrompts: prompts
      }
    },
    setNodeData(state, action) {
      const { id, data } = action.payload;
      state.nodeData[id] = data;
    },
    setEdgeData(state, action) {
      const { id, data } = action.payload;
      state.edgeData[id] = data;
    },
    addNode(state, action) {
      const viewport = action.payload;
      console.log(viewport);
      let nodeData = {...state.nodeData};
      let nodes = [...state.nodes];
      let id = Math.random(1000).toString();
      nodeData[id] = { label: "New node", type: "DP"};
      const newNode = {
        id: id,
        type: "customNode",
        position: {
          x:  -(viewport.x-500) / viewport.zoom,
          y:  -(viewport.y-500) / viewport.zoom,
        },
        style: { maxWidth: 500 }
      };
      nodes.push(newNode);
      return {
        ...state,
        nodeData: {...nodeData},
        nodes: [...nodes]
      }
    },
    loadNodes(state, action) {
      // init nodes from the selected discussion points
      const { selectedText, selectedKeywords, discussionPoints } = action.payload;
      console.log(selectedKeywords);
      console.log(discussionPoints);
      let new_nodes = [];
      let new_edges = [];
      const node_width = 300;
      const node_height = 100;
      const maxWidth = 500;

      let nodeData = {...state.nodeData};
      let edgeData = {...state.edgeData};

      let keyPointMappings = {};
      selectedKeywords.map((k, index) => {
        keyPointMappings[k] = discussionPoints.filter((r) => r["keyword"] === k);
      });

      nodeData["selectedText"] = { label: selectedText, type: "A" };

      new_nodes.push({
        id: "selectedText",
        type: "customNode",
        data: { label: selectedText},
        position: { x: 150, y: 100 },
        style: { minWidth: node_width, minHeight: node_height, maxWidth: maxWidth }
      });

      selectedKeywords.map((k, windex) => {

        const parent_x = 500 * (windex % 2);
        const parent_y = 400 * Math.floor(windex / 2) + 300;

        nodeData[k] = { label: k, type: "K" };

        new_nodes.push({
          id: k,
          type: "customNode",
          data: { label: k},
          position: { x: parent_x, y: parent_y },
          parentNode: "selectedText",
          style: { minWidth: node_width, minHeight: node_height, maxWidth: maxWidth }
        });

        edgeData["selectedtext"+"-"+k+"-edge"] = { type: "includes" };

        new_edges.push({
          id: "selectedtext"+"-"+k+"-edge",
          source: "selectedText",
          target: k,
          sourceHandle: "bottom",
          type: "customEdge",
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: { stroke: "#555" },
          label: "includes",
          data: {
            type: "includes"
          }
        })

        keyPointMappings[k].map((p, pindex) => {

          const num_children = keyPointMappings[k].length;

          nodeData[k+"-"+pindex] = { label: p["prompt"], type: "DP" };

          new_nodes.push({
            id: k+"-"+pindex,
            type: "customNode",
            data: { label: p["prompt"] },
            parentNode: k,
            position: { x: (parent_x + (node_width + 100) * pindex) - (num_children * 400) / 2 , y: parent_y + 300 },
            style: { minWidth: node_width, minHeight: node_height, maxWidth: maxWidth }
          })

          edgeData[k+"-"+pindex+"-edge"] = { type: "includes" };

          new_edges.push({
            id: k+"-"+pindex+"-edge",
            source: k,
            target: k+"-"+pindex,
            sourceHandle: "bottom",
            type: "customEdge",
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            style: { stroke: "#555" },
            label: "includes",
            data: {
              type: "includes"
            }
          })
      });
      });

      console.log("load nodes finished")

      return {
        ...state,
        nodes: [...new_nodes],
        edges: [...new_edges],
        nodeData: {...nodeData},
        edgeData: {...edgeData},
        // finalKeywords: state.editor.selectedKeywords
      };
    },
  },
});

export const { onNodesChange, onEdgesChange, onConnect, loadNodes, setSelectedPrompts, addNode, setNodeData, setEdgeData } =
  flowSlice.actions;

export default flowSlice.reducer;
