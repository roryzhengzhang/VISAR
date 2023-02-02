import { memo, FC } from "react";
import { Handle, Position, NodeProps } from "reactflow";

import { NodeResizer } from "@reactflow/node-resizer";
import { Typography, Box } from "@mui/material";

import "@reactflow/node-resizer/dist/style.css";

const CustomGroupNode = ({ data }) => {
  return (
    <Box style={{ opacity: 0.2}}>
      <NodeResizer minWidth={100} minHeight={30} />
      <Handle type="target" id="a" position={Position.Left} />
      <Handle type="target" id="b" position={Position.Top} />
      <div style={{ padding: 10 }}>
        <Typography style={{ fontSize: 20}}>{data.label}</Typography>
      </div>
      <Handle type="source" id="c" position={Position.Bottom} />
      <Handle type="source" id="d" position={Position.Right} />
    </Box>
  );
};

CustomGroupNode.displayName = "customGroup";

export default memo(CustomGroupNode);
