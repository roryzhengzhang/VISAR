import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  setEdgeData,
  setDepGraphNodeAttribute,
  setNodeDataAttribute
} from '../../LexicalEditor/slices/FlowSlice'
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getMarkerEnd
} from 'reactflow'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import { NodeEdgeTypeMapping } from '../../LexicalEditor/slices/FlowSlice'

const CustomEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  })

  const dispatch = useDispatch()
  const edgeData = useSelector(state => state.flow.edgeData)
  const [isEditing, setIsEditing] = React.useState(false)

  const nodeTypeMapping = {
    "featuredBy": 'K',
    "elaboratedBy": 'DP',
    "attackedBy": 'CA',
    "supportedBy": 'S'
  }

  const onEdgeTypeChange = e => {
    const newType = e.target.value
    dispatch(setEdgeData({ data: { type: newType }, id: id }))
    // update the type of the target node
    dispatch(
      setDepGraphNodeAttribute({
        nodeKey: target,
        attribute: 'type',
        value: newType
      })
    )
    dispatch(
      setNodeDataAttribute({
        nodeKey: target,
        attribute: 'type',
        value: nodeTypeMapping[newType]
      })
    )
  }

  return (
    <>
      <path
        id={id}
        className='react-flow__edge-path'
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        {!isEditing ? (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#ffcc00',
              padding: 10,
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 700,
              pointerEvents: 'all'
            }}
            className='nodrag nopan custom-edge'
            onClick={() => {
              console.log('Edge text is clicked')
              setIsEditing(true)
            }}
          >
            {NodeEdgeTypeMapping[edgeData[id].type]}
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#ffcc00',
              padding: 10,
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 700,
              pointerEvents: 'all'
            }}
            className='nodrag nopan'
          >
            <FormControl fullWidth>
              <InputLabel id='demo-simple-select-label'>Type</InputLabel>
              <Select
                labelId='simple-select-type'
                id={`simple-select-type+${id}`}
                value={edgeData[id].type}
                label='Type'
                onChange={onEdgeTypeChange}
                onClose={() => setIsEditing(false)}
              >
                <MenuItem value='elaboratedBy'>Elaborated By</MenuItem>
                <MenuItem value='featuredBy'>Featured By</MenuItem>
                <MenuItem value='attackedBy'>Attacked By</MenuItem>
                <MenuItem value='supportedBy'>Supported By</MenuItem>
              </Select>
            </FormControl>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}

export default CustomEdge
