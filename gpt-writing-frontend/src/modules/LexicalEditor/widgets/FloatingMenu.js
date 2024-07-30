import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDependency, getDependencies } from "../neo4j";
import { useDispatch, useSelector } from "react-redux";
import {
  positionFloatingButton,
  highlightDepText,
  removeNode,
  colorMapping,
} from "../utils";
import {
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $setSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  $isParagraphNode,
  $isTextNode,
  $createRangeSelection,
  $getRoot,
  $createTextNode,
  createCommand,
  KEY_BACKSPACE_COMMAND,
  KEY_ENTER_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  $isNodeSelection,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import {
  ELABORATE_COMMAND,
  ADD_EXAMPLE_COMMAND,
  SHOW_DEPENDENCY_COMMAND,
  ADD_TO_GRAPH_COMMAND,
  lowPriority,
  highPriority,
} from "../commands/SelfDefinedCommands";
import {
  $createHighlightDepNode,
  $isHighlightDepNode,
} from "../nodes/HighlightDepNode";
import {
  setCurRangeNodeKey,
  setAddNodeModalOpen,
  setCurSelection,
  setCurSelectedNodeKey,
} from "../slices/EditorSlice";
import {
  addUserDefinedFlowNode,
  setNodeSelected,
  removeNodeFromDepGraph,
  logInteractionData,
} from "../slices/FlowSlice";

export function FloatingMenu({ editor }) {
  // show the floating menu (elaborate, add to graph), and also add background color to the editor nodes
  const buttonRef = useRef(null);
  const dispatch = useDispatch();
  const username = useSelector((state) => state.editor.username);
  const sessionId = useSelector((state) => state.editor.sessionId);
  const nodeData = useSelector((state) => state.flow.nodeData);
  const nodeMappings = useSelector((state) => state.flow.flowEditorNodeMapping);
  const dependencyGraph = useSelector((state) => state.flow.dependencyGraph);
  const curClickedNodeKey = useSelector(
    (state) => state.editor.curClickedNodeKey
  );

  // highlight the text of dependency of the selected node
  const showDependencies = useCallback(() => {
    const selection = $getSelection();

    const node = selection.getNodes()[0];

    getDependencies(node).then((res) => {
      highlightDepText(editor, res);
    });

    // highlightText(editor, selection.getTextContent(), undefined, undefined, "highlight-dep-elb")

    // console.log(`selection content: ${selection.getTextContent()}`)

    // node.setStyle(" background-color: #cdb4db; padding: 1px 0.25rem; font-family: Menlo, Consolas, Monaco, monospace; font-size: 94%; border-radius: 25px;");
  }, [editor]);

  // callback updating floating button position
  const updateFloatingButton = useCallback(() => {
    // console.log("updateFloatingButton was called")

    const selection = $getSelection();
    const buttonElem = buttonRef.current;
    const nativeSelection = window.getSelection();
    const domRange =
      nativeSelection.rangeCount > 0 ? nativeSelection.getRangeAt(0) : null;
    // for (const [key, value] of Object.entries(nodeData)){
    //   console.log("[float menu]nodeData is ", key, value)
    // }
    let nodes = null
    if (selection) {
      nodes = selection.getNodes();
    } else {
      return
    }
    

    const paragraphNodes = nodes.filter(
      (node) => node.getType() === "paragraph"
    );

    if (buttonElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (
      selection != null &&
      !nativeSelection.isCollapsed &&
      rootElement != null &&
      rootElement.contains(nativeSelection.anchorNode) &&
      domRange &&
      paragraphNodes.length <= 1
    ) {
      let rect;
      if (nativeSelection.anchorNode === rootElement) {
        // nativeSelection.anchorNode is usually just the text string, so ususally not equal
        console.log(
          "[floating menu] native selection's anchor node === root element"
        );
        let inner = rootElement;
        while (inner.firstElementChild != null) {
          inner = inner.firstElementChild;
        }
        rect = inner.getBoundingClientReact();
      } else {
        rect = domRange.getBoundingClientRect();
      }

      positionFloatingButton(buttonElem, rect);
    } else {
      positionFloatingButton(buttonElem, null);
    }

    return true;
  }, [editor]);

  // set multiple registers to dispatch command (eg. KEY_ENTER_COMMAND, ADD_TO_GRAPH_COMMAND, ...)
  // SELECTION_CHANGE_COMMAND: update the floating button position when this is
  useEffect(() => {
    const buttonElem = buttonRef.current;

    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        // set a listener, be triggered when the editor's states are changed
        editorState.read(() => {
          // read the updated editor's state
          updateFloatingButton();
        });
      }),

      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          const curClickeddNode = $getNodeByKey(curClickedNodeKey);
          if (
            curClickedNodeKey !== "" &&
            $isHighlightDepNode(curClickeddNode)
          ) {
            editor.setEditable(false);
            return true;
          }

          console.log(
            "[KEY_ENTER_COMMAND] curSelectedNodeKey: ",
            curClickedNodeKey
          );

          return false;
        },
        highPriority
      ),

      editor.registerCommand(
        INSERT_LINE_BREAK_COMMAND,
        () => {
          console.log("INSERT_LINE_BREAK_COMMAND was called");
        },
        lowPriority
      ),

      editor.registerCommand(
        ADD_TO_GRAPH_COMMAND,
        () => {
          dispatch(setAddNodeModalOpen());
          return true;
        },
        lowPriority
      ),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          console.log("[floating menu] selection is changed");
          const selection = $getSelection();
          console.log(
            "[floating menu] selection's type is node selection ",
            $isNodeSelection(selection)
          );
          console.log(
            "[floating menu] selection's type is range selection ",
            $isRangeSelection(selection)
          );
          console.log(
            "[floating menu] the selection's anchor's offset: ",
            selection.anchor.offset
          );
          updateFloatingButton();
          return false;
        },
        lowPriority
      ),

      editor.registerCommand(
        SHOW_DEPENDENCY_COMMAND,
        () => {
          showDependencies();

          positionFloatingButton(buttonElem, null);
          return true;
        },
        lowPriority
      )
    );
  }, [editor, updateFloatingButton, curClickedNodeKey]);

  // this is the function to set the background color of the editor node
  // if the node is selected, then also add dashed green line to indicate it is selected
  useEffect(() => {
    editor.update(() => {
      for (const [key, value] of Object.entries(nodeMappings)) {
        const SelectedEditorNodeKey = nodeMappings[key];
        const editorNode = $getNodeByKey(SelectedEditorNodeKey);
        const depData = dependencyGraph[key];
        const flowNode = nodeData[key];
        console.log("[flow menu] nodeMapping is ", nodeMappings)
        if (
          editorNode == null ||
          SelectedEditorNodeKey == null ||
          depData == null ||
          flowNode == null
        ) {
          console.log("[flow menu] editor node is", editorNode)
          continue;
        }

        console.log("curNode['type']: ", depData["type"]);
        console.log("[flow menu] editor node is ", editorNode)
        console.log("[flow menu] depData is ", depData)
        console.log("[flow menu] flow node is ", flowNode)
        if (flowNode.selected === true) {
          // set bottom border of the node to incidate it is selected
          if (
            $isHighlightDepNode(editorNode) &&
            depData["userEntered"] === true
          ) {
            editorNode.setStyle(
              "border: dashed green; background-color: #bde0fe;"
            );
          } else if ($isHighlightDepNode(editorNode)) {
            if (depData["type"] === "root") {
              editorNode.setStyle(
                `border: dashed green; background-color: ${colorMapping["root"]};`
              );
            } else if (depData["type"] === "featuredBy") {
              editorNode.setStyle(
                `border: dashed green; background-color: ${colorMapping["featuredBy"]};`
              );
            } else if (depData["type"] === "elaboratedBy") {
              editorNode.setStyle(
                `border: dashed green; background-color: ${colorMapping["elaboratedBy"]};`
              );
            } else if (depData["type"] === "attackedBy") {
              editorNode.setStyle(
                `border: dashed green; background-color: ${colorMapping["attackedBy"]};`
              );
            } else if (depData["type"] === "supportedBy") {
              editorNode.setStyle(
                `border: dashed green; background-color: ${colorMapping["supportedBy"]};`
              );
            } else {
              editorNode.setStyle(
                `border: dashed green; background-color:  #f9c74f;`
              );
            }
          } else {
            console.log(`editorNode ${SelectedEditorNodeKey} is not a hl node`);
            //editorNode.setStyle("border: dashed green;");
          }
        } else {
          // remove bottom border
          if (
            $isHighlightDepNode(editorNode) &&
            depData["userEntered"] === true
          ) {
            editorNode.setStyle("background-color: #bde0fe;");
          } else if ($isHighlightDepNode(editorNode)) {
            if (depData["type"] === "root") {
              editorNode.setStyle(`background-color: ${colorMapping["root"]};`);
            } else if (depData["type"] === "featuredBy") {
              editorNode.setStyle(
                `background-color: ${colorMapping["featuredBy"]};`
              );
            } else if (depData["type"] === "elaboratedBy") {
              editorNode.setStyle(
                `background-color: ${colorMapping["elaboratedBy"]};`
              );
            } else if (depData["type"] === "attackedBy") {
              editorNode.setStyle(
                `background-color: ${colorMapping["attackedBy"]};`
              );
            } else if (depData["type"] === "supportedBy") {
              editorNode.setStyle(
                `background-color: ${colorMapping["supportedBy"]};`
              );
            } else {
              editorNode.setStyle(`background-color:  #f9c74f;`);
            }
          } else {
            console.log(`editorNode ${SelectedEditorNodeKey} is not a hl node`);
            //editorNode.setStyle("background-color: white;");
          }
        }
      }
    });
  }, [nodeData, nodeMappings]);

  useEffect(() => {
    // editor.getEditorState().read(() => {
    //   updateFloatingButton()
    // })
  }, [editor, updateFloatingButton]);

  return (
    <div ref={buttonRef} className="floatbuttongroup">
      <button
        className="float-item"
        onClick={() => {
          editor.update(() => {
            const selection = $getSelection();
            const node = selection.getNodes()[0];
            const curRangeNodeKey = node.getKey();
            dispatch(setCurRangeNodeKey(curRangeNodeKey));
            dispatch(setNodeSelected(curRangeNodeKey));
            dispatch(setCurSelection(selection.getTextContent()));

            editor.dispatchCommand(ELABORATE_COMMAND, null);
            positionFloatingButton(buttonRef.current, null);

            dispatch(
              logInteractionData({
                username: username,
                sessionId: sessionId,
                type: "elaborate",
                interactionData: {
                  textNodeKey: curRangeNodeKey,
                  content: selection.getTextContent(),
                },
              })
            );
          });
        }}
      >
        Elaborate
      </button>
      <button
        className="float-item"
        onClick={() => {
          editor.dispatchCommand(ADD_TO_GRAPH_COMMAND, null);
          positionFloatingButton(buttonRef.current, null);
        }}
      >
        Add to graph
      </button>
      {/* <button
        className='float-item'
        onClick={() => {
          editor.dispatchCommand(SHOW_DEPENDENCY_COMMAND, null)
          positionFloatingButton(buttonRef.current, null)
        }}
      >
        Show dependency
      </button> */}
    </div>
  );
}
