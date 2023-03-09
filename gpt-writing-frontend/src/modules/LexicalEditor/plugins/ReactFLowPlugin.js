import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useSelector, useDispatch } from "react-redux";
import { ReactFlowProvider } from "reactflow";
import Flow from "../widgets/Flow";
import { Box } from "@mui/material";

export default function ReactFlowPlugin() {
  const [editor] = useLexicalComposerContext();

  return (
    <Box className="reactflow-view-output-new">
      <ReactFlowProvider>
        <Flow editor={editor} mode="plugin" sidebar={false} />
      </ReactFlowProvider>
    </Box>
  );
}
