import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "@mui/material/Modal";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  useViewport,
  Panel
} from "reactflow";
import "reactflow/dist/style.css";
import { useDispatch, useSelector } from "react-redux";
import { setModalOpen, setModalClose } from "../slices/EditorSlice";
import { cyan, teal, pink, amber } from '@mui/material/colors';
import {
  onNodesChange,
  onEdgesChange,
  onConnect,
  loadNodes,
  addNode,
} from "../slices/FlowSlice";
import { Box, Typography, Button, Grid, Stack, Avatar } from "@mui/material";
import ResizableNode from "../../ReactFlow/nodes/ResizableNode";
import CustomGroupNode from "../../ReactFlow/nodes/CustomGroupNode";
import CustomEdge from "../../ReactFlow/edges/CustomEdge";
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80vw",
  height: "90vh",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
};

const nodeTypes = {
  "customNode": ResizableNode,
  CustomGroupNode,
};

const edgeTypes = {
  "customEdge": CustomEdge,
};

function Flow(props) {
  const dispatch = useDispatch();
  const { setNodes, setEdges } = useReactFlow();
  const nodes = useSelector((state) => state.flow.nodes);
  const edges = useSelector((state) => state.flow.edges);
  const avatarColors = useSelector((state) => state.flow.avatarColors);
  const selectedPrompts = useSelector((state) => state.editor.selectedPrompts);
  const viewport = useViewport();

  const nodeColor = (node) => {
    switch (node.type) {
      case "input":
        return "#6ede87";
      case "output":
        return "#6865A5";
      default:
        return "#ff0072";
    }
  };


  return (
    <Grid container sx={style} spacing={2}>
      <Grid item xs={11}>
        <ReactFlow
          nodes={nodes}
          onNodesChange={(change) => dispatch(onNodesChange(change))}
          edges={edges}
          onEdgesChange={(change) => dispatch(onEdgesChange(change))}
          onConnect={(change) => dispatch(onConnect(change))}
          nodeTypes={nodeTypes}
          elementsSelectable={true}
          edgeTypes={edgeTypes}
          fitView
        >
          <Background variant="dots" gap={12} size={1} />
          <Controls />
          <Panel position="top-left">
            <Stack direction="row" spacing={2} style={{ alignItems: "center", marginBottom: 4 }}>
              <Avatar sx={{bgcolor: avatarColors["K"]}} style={{ width: 20, height: 20, fontSize: 10 }}>K</Avatar>
              <Typography variant="body1" style={{ mt: 5, fontSize: 12 }}>Keyword</Typography>
            </Stack>
            <Stack direction="row" spacing={2} style={{ alignItems: "center", marginBottom: 4 }}>
              <Avatar sx={{bgcolor: avatarColors["A"]}} style={{ width: 20, height: 20, fontSize: 10 }}>A</Avatar>
              <Typography variant="body1" style={{ mt: 5, fontSize: 12 }}>Argument</Typography>
            </Stack>
            <Stack direction="row" spacing={2} style={{ alignItems: "center", marginBottom: 4 }}>
              <Avatar sx={{bgcolor: avatarColors["DP"]}} style={{ width: 20, height: 20, fontSize: 10 }}>DP</Avatar>
              <Typography variant="body1" style={{ mt: 5, fontSize: 12 }}>Discussion Points</Typography>
            </Stack>
          </Panel>
          <MiniMap
            nodeColor={nodeColor}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
        </ReactFlow>
      </Grid>
      <Grid item xs={1}>
        <Stack spacing={2}>
          <Button variant="contained" onClick={() => dispatch(addNode(viewport))}>Add</Button>
          <Button variant="contained">Reset</Button>
        </Stack>
      </Grid>
    </Grid>
  );
}

export default function PromptModal() {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const modalOpen = useSelector((state) => state.editor.modalOpen);
  const selectedPrompts = useSelector((state) => state.editor.selectedPrompts);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    console.log("modalOpen is changed to " + modalOpen);
  }, [modalOpen]);

  useEffect(() => {
    console.log("modal rendered");
  }, []);

  const updateNodes = () => {
    dispatch(loadNodes());
  };

  return (
    <div>
      <Modal
        open={modalOpen}
        onClose={() => dispatch(setModalClose())}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box>
          <ReactFlowProvider>
            <Flow />
          </ReactFlowProvider>
        </Box>
      </Modal>
    </div>
  );
}
