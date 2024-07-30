import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React, { memo, useEffect } from "react";
import { assignNewEditorNodeKeyToMapping } from "../utils";
import { useDispatch, useSelector } from "react-redux";
import { extendFlowEditorNodeMapping } from "../slices/FlowSlice";

const LoadEditorStatePlugin = memo(({ editorState }) => {
  const [editor] = useLexicalComposerContext();
  const dispatch = useDispatch()
  const dependencyGraph = useSelector((state) => state.flow.dependencyGraph);
  const nodeMapping = useSelector((state) => state.flow.flowEditorNodeMapping);

  useEffect(() => {
    if (editorState) {
      editor.update(() => {
        const initEditorState = editor.parseEditorState(editorState);
        const newNodeMapping = assignNewEditorNodeKeyToMapping(
          initEditorState._nodeMap,
          dependencyGraph,
          nodeMapping
        );
        dispatch(extendFlowEditorNodeMapping(newNodeMapping));
        editor.setEditorState(initEditorState);
      });
    }
  }, [editor, editorState]);

  return null;
});

export default LoadEditorStatePlugin;
