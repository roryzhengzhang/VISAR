import { memo, useState } from "react";
import { Handle, Position, useNodeId } from "reactflow";
import { useSelector, useDispatch } from "react-redux";
import { setNodeData } from "../../LexicalEditor/slices/FlowSlice";
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Grid,
  IconButton,
  Tooltip,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { NodeResizer } from "@reactflow/node-resizer";
import { cyan, teal, pink, amber } from "@mui/material/colors";

import "@reactflow/node-resizer/dist/style.css";

const ResizableNode = ({ data }) => {
  const dispatch = useDispatch();
  const avatarColors = useSelector((state) => state.flow.avatarColors);
  const nodeId = useNodeId();
  const [isEditing, setIsEditing] = useState(false);

  const nodeData = useSelector((state) => state.flow.nodeData);

  return (
    <>
      {/* <NodeResizer minWidth={100} minHeight={30} /> */}
      {/* <Handle type="target" id="left" position={Position.Left} /> */}
      <Handle type="target" id="top" position={Position.Top} />
      <div style={{ padding: 10 }}>
        <Box style={{ alignItems: "center" }}>
          <Box>
            <Avatar
              style={{ width: 30, height: 30, fontSize: 18 }}
              sx={{ bgcolor: avatarColors[nodeData[nodeId].type] }}
            >
              {nodeData[nodeId].type}
            </Avatar>
          </Box>
          <Box
            style={{
              textAlign: "center",
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 40,
              marginRight: 40,
              marginBottom: 20,
            }}
          >
            {!isEditing ? (
              <Box>
                <Typography variant="body1" style={{ fontSize: 20 }}>
                  {nodeData[nodeId].label}
                </Typography>
                <Tooltip title="Edit">
                  <IconButton onClick={() => setIsEditing(true)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : (
              <Box>
                <TextField
                  id="edit-node-text"
                  style={{
                    minWidth: 300,
                  }}
                  value={nodeData[nodeId].label}
                  onChange={(event) => dispatch(setNodeData({ id: nodeId, data: {label: event.target.value, type: nodeData[nodeId].type}}))}
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setIsEditing(false);
                    }
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </div>
      <Handle type="source" id="bottom" position={Position.Bottom} />
      {/* <Handle type="source" id="right" position={Position.Right} /> */}
    </>
  );
};

export default memo(ResizableNode);
