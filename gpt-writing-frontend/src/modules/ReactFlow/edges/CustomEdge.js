import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setEdgeData } from "../../LexicalEditor/slices/FlowSlice";
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getMarkerEnd,
} from "reactflow";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const dispatch = useDispatch();
  const edgeData = useSelector((state) => state.flow.edgeData);
  const [isEditing, setIsEditing] = React.useState(false);

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        {!isEditing ? (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: "#ffcc00",
              padding: 10,
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 700,
              pointerEvents: "all",
            }}
            className="nodrag nopan custom-edge"
            onClick={() => {
              console.log("Edge text is clicked");
              setIsEditing(true);
            }}
          >
            {edgeData[id].type}
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: "#ffcc00",
              padding: 10,
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 700,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Type</InputLabel>
              <Select
                labelId="simple-select-type"
                id={`simple-select-type+${id}`}
                value={edgeData[id].type}
                label="Type"
                onChange={(e) =>
                  dispatch(
                    setEdgeData({ data: { type: e.target.value }, id: id })
                  )
                }
                onClose={() => setIsEditing(false)}
              >
                <MenuItem value="includes">Includes</MenuItem>
                <MenuItem value="elaborates">Elaborates</MenuItem>
                <MenuItem value="justifies">Justifies</MenuItem>
              </Select>
            </FormControl>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
