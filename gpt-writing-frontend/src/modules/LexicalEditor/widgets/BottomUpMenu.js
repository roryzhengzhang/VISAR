import React, { useState } from "react";
import { mergeRegister } from "@lexical/utils";
import { useEffect, useRef, useCallback } from "react";
import {
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isTextNode,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  lowPriority,
  SHOW_LOADING_COMMAND,
} from "../commands/SelfDefinedCommands";
import {
  addThesisToEditor,
  DFSGetText,
  filterNodesByClassName,
  positionFloatingButton,
} from "../utils";
import { useDispatch, useSelector } from "react-redux";
import {
  extendFlowEditorNodeMapping,
  loadNodesBottomUp,
  setFlowEditorNodeMapping,
} from "../slices/FlowSlice";
import {
  $createHighlightDepNode,
  $isHighlightDepNode,
} from "../nodes/HighlightDepNode";
import { $createTextBlockNode } from "../nodes/TextBlockNode";

const BottomUpMenu = ({ editor }) => {
  const buttonRef = useRef(null);
  const dispatch = useDispatch();
  const nodeMappings = useSelector((state) => state.flow.flowEditorNodeMapping);
  const depGraph = useSelector((state) => state.flow.dependencyGraph);

  // State to track when to call addThesisToEditor
  const [shouldAddThesis, setShouldAddThesis] = useState(false);
  const [thesisData, setThesisData] = useState({
    thesisText: "",
    keyPointsEditorNodeKeys: [],
  });

  const updateBottomUpMenu = useCallback(() => {
    const selection = $getSelection();
    const buttonElem = buttonRef.current;
    const nativeSelection = window.getSelection();

    let nodes = null;
    if (selection) {
      nodes = selection.getNodes();
    } else {
      return;
    }

    //const paragraphNodes = filterNodesByClassName(editor, nodes, "dir")
    //console.log("paragraph nodes are ", paragraphNodes)
    const paragraphNodes = nodes.filter(
      (node) => node.getType() === "paragraph"
    );

    const domRange =
      nativeSelection.rangeCount > 0 ? nativeSelection.getRangeAt(0) : null;
    if (buttonElem === null || domRange === null) return;

    const rootElement = editor.getRootElement();
    if (
      selection != null &&
      !nativeSelection.isCollapsed &&
      rootElement != null &&
      rootElement.contains(nativeSelection.anchorNode) &&
      paragraphNodes.length > 1
    ) {
      const selectedRects = domRange.getClientRects();
      console.log("[bottom up menu] selectedRects are ", selectedRects);
      const rect = selectedRects[selectedRects.length - 1];
      //console.log("[buttom up menu] last selected rect is ", rect);
      positionFloatingButton(buttonElem, rect);
    } else {
      positionFloatingButton(buttonElem, null);
    }

    return true;
  }, [editor]);

  const onGenerationThesisClick = async () => {
    editor.update(() => {
      editor.dispatchCommand(SHOW_LOADING_COMMAND, { show: true });
    });
    const buttonElem = buttonRef.current;

    const selection = $getSelection();
    const nodes = selection.getNodes();

    const paragraphNodes = nodes.filter(
      (node) => node.getType() === "paragraph"
    );
    //console.log("[bottom up menu] paragraph nodes are ", paragraphNodes)
    // </br> will not be a "child" in the paragraph node

    const textInEachParagraph = [];
    paragraphNodes.forEach((paragraph) => {
      const textArray = DFSGetText(paragraph);
      if (textArray.length > 0) {
        const text = textArray.join(" ");
        textInEachParagraph.push(text);
      }
    });
    console.log("text in each paragraph is", textInEachParagraph);

    const response = await fetch("http://127.0.0.1:5000/synthesize", {
      method: "POST",
      mode: "cors",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        keyPoints: textInEachParagraph,
      }),
    });

    const data = await response.json();
    const thesisText = data["response"];
    editor.update(() => {
      editor.dispatchCommand(SHOW_LOADING_COMMAND, { show: false });
    });

    //const thesisText = "this is the thesis statement";

    const keyPointsEditorNodeKeys = [];
    const keyPoints = [];
    editor.update(() => {
      paragraphNodes.forEach((paragraph) => {
        let editorNode = paragraph;
        while ($isElementNode(editorNode)) {
          const children = editorNode.getChildren();
          if (children.length > 0) {
            editorNode = children[0];
          } else {
            break;
          }
        }
        if ($isTextNode(editorNode) && editorNode.getTextContent().length > 0) {
          keyPointsEditorNodeKeys.push(editorNode.getKey());
          keyPoints.push(editorNode.getTextContent());
        }
      });
    });

    console.log("keyPointsEditorNodeKeys are", keyPointsEditorNodeKeys);

    dispatch(
      loadNodesBottomUp({
        thesis: thesisText,
        keyPointsEditorNodeKeys: keyPointsEditorNodeKeys,
        keyPoints: keyPoints,
      })
    );

    // Set state to trigger the effect: the redux state is not updated immediately
    setThesisData({ thesisText, keyPointsEditorNodeKeys });
    setShouldAddThesis(true);

    positionFloatingButton(buttonElem, null);
  };

  useEffect(() => {
    if (shouldAddThesis) {
      const { thesisText, keyPointsEditorNodeKeys } = thesisData;
      editor.update(() => {
        const firstKeyPointNode = $getNodeByKey(keyPointsEditorNodeKeys[0]);

        console.log("[bottom up menu] node mapping is ", nodeMappings);
        const nodeMappingsCopy = JSON.parse(JSON.stringify(nodeMappings));
        const updatedMappings = addThesisToEditor(
          thesisText,
          firstKeyPointNode,
          nodeMappingsCopy,
          depGraph
        );
        dispatch(extendFlowEditorNodeMapping(updatedMappings));

        // change the key point text node to highlight node
        for (const keyPointsEditorNodeKey of keyPointsEditorNodeKeys) {
          const node = $getNodeByKey(keyPointsEditorNodeKey);
          if ($isHighlightDepNode(node)) {
            continue;
          }

          const content = node.getTextContent();
          const textblockNode = $createTextBlockNode();
          const hlNode = $createHighlightDepNode("highlight-dep-elb", content);
          textblockNode.append(hlNode);
          node.replace(textblockNode);

          let flowKey = null;
          for (const [key, value] of Object.entries(nodeMappings)) {
            if (value === keyPointsEditorNodeKey) {
              flowKey = key;
              break;
            }
          }

          if (flowKey !== null) {
            dispatch(
              setFlowEditorNodeMapping({
                flowKey: flowKey,
                EditorKey: hlNode.__key,
              })
            );
          }
        }

        setShouldAddThesis(false); // Reset the flag
      });
    }
  }, [shouldAddThesis, thesisData, nodeMappings, depGraph, dispatch]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        // set a listener, be triggered when the editor's states are changed
        editorState.read(() => {
          // read the updated editor's state
          updateBottomUpMenu();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          console.log("[bottom up menu] selection is changed");
          updateBottomUpMenu();
          return false;
        },
        lowPriority
      )
    );
  }, [editor, updateBottomUpMenu]);

  return (
    <div ref={buttonRef} className="floatbuttongroup">
      <button
        className="float-item"
        onClick={() => {
          editor.update(() => {
            onGenerationThesisClick();

            positionFloatingButton(buttonRef.current, null);
          });
        }}
      >
        Synthesize
      </button>
    </div>
  );
};

export default BottomUpMenu;
