import {
  $getRoot,
  $createTextNode,
  $isParagraphNode,
  $getSelection,
  $createParagraphNode,
  $getNodeByKey,
  $setSelection,
  $createRangeSelection,
  $createLineBreakNode,
  $isTextNode,
  $isRootNode,
  $isRootOrShadowRoot,
  $isRangeSelection,
  $isElementNode,
  $hasAncestor,
  ParagraphNode,
  TextNode,
  RootNode,
  LineBreakNode,
} from "lexical";
import { SHOW_LOADING_COMMAND } from "./commands/SelfDefinedCommands";
import {
  $createHighlightDepNode,
  $isHighlightDepNode,
  HighlightDepNode,
} from "./nodes/HighlightDepNode";
import { useDispatch } from "react-redux";
import {
  $createTextBlockNode,
  $isTextBlockNode,
  TextBlockNode,
} from "./nodes/TextBlockNode";
import { cyan, teal, pink, amber, blue, purple } from "@mui/material/colors";

function randomizeBGColor() {
  const colors = [
    "#b0f2b4",
    "#baf2e9",
    "#f2bac9",
    "#cdc1ff",
    "#ffc300",
    "#d6e2e9",
    "#ffb3c1",
    "#f9c74f",
  ];
  const id = Math.floor(Math.random() * colors.length);

  return "#ffb3c1";
}

export const colorMapping = {
  attackedBy: "#ff758f",
  elaboratedBy: "#ffd60a",
  featuredBy: "#e2afff",
  supportedBy: "#83c5be",
  root: "#bde0fe",
};

export function positionFloatingButton(buttonGroup, rect) {
  if (rect === null) {
    buttonGroup.style.opacity = "0";
    buttonGroup.style.top = "-1000px";
    buttonGroup.style.left = "-1000px";
  } else {
    buttonGroup.style.opacity = "1";
    buttonGroup.style.top = `${
      rect.top + rect.height + window.pageYOffset + 10
    }px`;
    buttonGroup.style.left = `${Math.max(
      rect.left +
        window.pageXOffset -
        buttonGroup.offsetWidth / 2 +
        rect.width / 2,
      10
    )}px`;
  }
}

export function $maybeMoveChildrenSelectionToParent(parentNode, offset = 0) {
  if (offset !== 0) {
  }
  const selection = $getSelection(); // selection is the last selection
  if (selection) {
    console.log("[maybeMoveChildren] nodeToRemove is ", parentNode);
    console.log("[maybeMoveChildren] selection is ", selection);
    console.log(
      "[maybeMoveChildren] selection's anchor's node is ",
      selection.anchor.getNode()
    );
    console.log(
      "[maybeMoveChildren] selection's focus's node is ",
      selection.focus.getNode()
    );
    console.log(
      "[maybeMoveChildren] selection's anchor's node's offset is ",
      selection.anchor.offset
    ); // this will be 0
    console.log(
      "[maybeMoveChildren] selection's focus's node's offset is ",
      selection.focus.offset
    ); // this will be 0
    // An element node is a node that can contain other nodes
    // if the node is element node, the node is the "parent"
    // this if statement checks if the node is a range or parent. If not range, or it is a leaf, then do not need to update anything
  }

  if (!$isRangeSelection(selection) || !$isElementNode(parentNode)) {
    console.log(
      "[maybeMoveChildren] the selection is range selection: ",
      $isRangeSelection(selection)
    );
    console.log("the parent node is not range selection or element node");
    return selection;
  }
  console.log("the parent node is range selection or element node");
  const { anchor, focus } = selection;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  console.log(
    "[maybeMoveChildren] anchor offset and focus offset before is ",
    anchorNode.offset,
    focusNode.offset
  );
  console.log(
    "[maybeMoveChildren] nodeToRemove is anchor's ancestor: ",
    $hasAncestor(anchorNode, parentNode)
  );
  if ($hasAncestor(anchorNode, parentNode)) {
    anchor.set(parentNode.__key, 0, "element");
  }
  if ($hasAncestor(focusNode, parentNode)) {
    focus.set(parentNode.__key, 0, "element");
  }
  console.log(
    "[maybeMoveChildren] anchor offset and focus offset after is ",
    anchorNode.offset,
    focusNode.offset
  );
  return selection;
}

export function moveSelectionPointToSibling(
  point,
  node,
  parent,
  prevSibling,
  nextSibling
) {
  let siblingKey = null;
  let offset = 0;
  let type = null;
  console.log("previous sibling of removed node is ", prevSibling);
  console.log("next sibling of removed node is ", nextSibling);
  if (prevSibling !== null) {
    siblingKey = prevSibling.__key;
    if ($isTextNode(prevSibling)) {
      offset = prevSibling.getTextContentSize();
      type = "text";
    } else if ($isElementNode(prevSibling)) {
      offset = prevSibling.getChildrenSize();
      type = "element";
    }
  } else {
    if (nextSibling !== null) {
      siblingKey = nextSibling.__key;
      if ($isTextNode(nextSibling)) {
        type = "text";
      } else if ($isElementNode(nextSibling)) {
        type = "element";
      }
    }
  }
  if (siblingKey !== null && type !== null) {
    point.set(siblingKey, offset, type);
  } else {
    console.log("[moveSelectionPointToSibling] removed node has no siblings");
    offset = node.getIndexWithinParent();
    console.log("???offset within parent is ", offset);
    if (offset === -1) {
      // Move selection to end of parent
      offset = parent.getChildrenSize();
    }
    point.set(parent.__key, offset, "element");
  }
}
export function $updateElementSelectionOnCreateDeleteNode(
  selection,
  parentNode,
  nodeOffset,
  times = 1
) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  console.log(
    "[updateElementSelectionOnCreateDeleteNode] anchor node is ",
    anchorNode,
    anchor.offset
  );
  console.log(
    "[updateElementSelectionOnCreateDeleteNode] focus node is ",
    focusNode,
    focus.offset
  );
  if (!parentNode.is(anchorNode) && !parentNode.is(focusNode)) {
    console.log(
      "parent is not selection's anchor node and not selection's focus node"
    );
    return;
  }
  console.log("parent is selection's anchor node or selection's focus node");
  const parentKey = parentNode.__key;
  // Single node. We shift selection but never redimension it
  if (selection.isCollapsed()) {
    console.log(
      "[updateElementSelectionOnCreateDeleteNode] selection is collapsed"
    );
    // selection is range selection, but it is collapsed
    const selectionOffset = anchor.offset;
    if (nodeOffset <= selectionOffset) {
      const newSelectionOffset = Math.max(0, selectionOffset + times);
      anchor.set(parentKey, newSelectionOffset, "element");
      focus.set(parentKey, newSelectionOffset, "element");
      console.log(
        "[updateElementSelectionOnCreateDeleteNode] anchor node is ",
        anchor.getNode(),
        anchor.offset
      );
      console.log(
        "[updateElementSelectionOnCreateDeleteNode] focus node is ",
        focus.getNode(),
        focus.offset
      );
      // The new selection might point to text nodes, try to resolve them
      $updateSelectionResolveTextNodes(selection);
    }
    return;
  }
  // Multiple nodes selected. We shift or redimension selection
  const isBackward = selection.isBackward();
  const firstPoint = isBackward ? focus : anchor;
  const firstPointNode = firstPoint.getNode();
  const lastPoint = isBackward ? anchor : focus;
  const lastPointNode = lastPoint.getNode();
  if (parentNode.is(firstPointNode)) {
    const firstPointOffset = firstPoint.offset;
    if (nodeOffset <= firstPointOffset) {
      firstPoint.set(
        parentKey,
        Math.max(0, firstPointOffset + times),
        "element"
      );
    }
  }
  if (parentNode.is(lastPointNode)) {
    const lastPointOffset = lastPoint.offset;
    if (nodeOffset <= lastPointOffset) {
      lastPoint.set(parentKey, Math.max(0, lastPointOffset + times), "element");
    }
  }
  // The new selection might point to text nodes, try to resolve them
  $updateSelectionResolveTextNodes(selection);
}

// set the anchor and focus to the ending position of the last child text node
function $updateSelectionResolveTextNodes(selection) {
  const anchor = selection.anchor;
  const anchorOffset = anchor.offset;
  const focus = selection.focus;
  const focusOffset = focus.offset;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  if (selection.isCollapsed()) {
    if (!$isElementNode(anchorNode)) {
      return;
    }
    const childSize = anchorNode.getChildrenSize();
    const anchorOffsetAtEnd = anchorOffset >= childSize;
    // get the last child
    const child = anchorOffsetAtEnd
      ? anchorNode.getChildAtIndex(childSize - 1)
      : anchorNode.getChildAtIndex(anchorOffset);
    if ($isTextNode(child)) {
      let newOffset = 0;
      if (anchorOffsetAtEnd) {
        newOffset = child.getTextContentSize();
      }
      // set both anchor and focus to the end of the child text
      anchor.set(child.__key, newOffset, "text");
      focus.set(child.__key, newOffset, "text");
    }
    return;
  }
  if ($isElementNode(anchorNode)) {
    const childSize = anchorNode.getChildrenSize();
    const anchorOffsetAtEnd = anchorOffset >= childSize;
    const child = anchorOffsetAtEnd
      ? anchorNode.getChildAtIndex(childSize - 1)
      : anchorNode.getChildAtIndex(anchorOffset);
    if ($isTextNode(child)) {
      let newOffset = 0;
      if (anchorOffsetAtEnd) {
        newOffset = child.getTextContentSize();
      }
      anchor.set(child.__key, newOffset, "text");
    }
  }
  if ($isElementNode(focusNode)) {
    const childSize = focusNode.getChildrenSize();
    const focusOffsetAtEnd = focusOffset >= childSize;
    const child = focusOffsetAtEnd
      ? focusNode.getChildAtIndex(childSize - 1)
      : focusNode.getChildAtIndex(focusOffset);
    if ($isTextNode(child)) {
      let newOffset = 0;
      if (focusOffsetAtEnd) {
        newOffset = child.getTextContentSize();
      }
      focus.set(child.__key, newOffset, "text");
    }
  }
}

export function removeNode(
  nodeToRemove,
  restoreSelection = true,
  preserveEmptyParent = true
) {
  // errorOnReadOnly();
  const key = nodeToRemove.__key; // the key of the editor text node
  const parent = nodeToRemove.getParent();
  if (parent === null) {
    return;
  }
  const selection = $maybeMoveChildrenSelectionToParent(nodeToRemove);
  let selectionMoved = false;
  if ($isRangeSelection(selection) && restoreSelection) {
    const anchor = selection.anchor;
    const focus = selection.focus;
    console.log(
      "[removeNode] where is anchor and focus: ",
      anchor.offset,
      focus.offset
    );
    if (anchor.key === key) {
      console.log("[removeNode] anchor key is the removed node key");
      moveSelectionPointToSibling(
        anchor,
        nodeToRemove,
        parent,
        nodeToRemove.getPreviousSibling(),
        nodeToRemove.getNextSibling()
      );
      selectionMoved = true;
    }
    if (focus.key === key) {
      console.log("[removeNode] focus key is the removed node key");
      moveSelectionPointToSibling(
        focus,
        nodeToRemove,
        parent,
        nodeToRemove.getPreviousSibling(),
        nodeToRemove.getNextSibling()
      );
      selectionMoved = true;
    }
    console.log(
      "[removeNode] after: where is anchor and focus: ",
      anchor.offset,
      focus.offset
    );
  }

  if ($isRangeSelection(selection) && restoreSelection && !selectionMoved) {
    // Doing this is O(n) so lets avoid it unless we need to do it
    const index = nodeToRemove.getIndexWithinParent();
    console.log(
      "[removeNode] the index of nodeToRemove within parent is ",
      index
    );
    removeFromParent(nodeToRemove); // linked list remove
    console.log("[removeNode] nodeToRemove's parent is ", parent);
    $updateElementSelectionOnCreateDeleteNode(selection, parent, index, -1);
  } else {
    console.log("selectin is rangeSelection ", $isRangeSelection(selection));
    removeFromParent(nodeToRemove);
  }

  if (
    !preserveEmptyParent &&
    !$isRootOrShadowRoot(parent) &&
    !parent.canBeEmpty() &&
    parent.isEmpty()
  ) {
    removeNode(parent, restoreSelection);
  }
  if (restoreSelection && $isRootNode(parent) && parent.isEmpty()) {
    parent.selectEnd();
  }
}

export function positionTextBlockMenu(buttonGroup, loc) {
  if (loc === null) {
    buttonGroup.style.opacity = "0";
    buttonGroup.style.top = "-1000px";
    buttonGroup.style.left = "-1000px";
  } else {
    buttonGroup.style.opacity = "1";
    buttonGroup.style.top = `${loc.top}px`;
    buttonGroup.style.left = `${Math.max(loc.left, 10)}px`;
  }
}

export function selectTextNodeByKey(editor, nodeKey) {
  editor.update(() => {
    const targetNode = $getNodeByKey(nodeKey);
    let newSelection = $createRangeSelection();
    newSelection.focus.set(nodeKey, 0, "text");
    newSelection.anchor.set(nodeKey, targetNode.getTextContentSize(), "text");
    $setSelection(newSelection);
  });
}

// remove the node by modifying the linked list
export function removeFromParent(node) {
  const oldParent = node.getParent();
  if (oldParent !== null) {
    const writableNode = node.getWritable();
    const writableParent = oldParent.getWritable();
    const prevSibling = node.getPreviousSibling();
    const nextSibling = node.getNextSibling();
    console.log(
      "[removeFromParent] nodeToRemove's prev and next sibling are ",
      prevSibling,
      nextSibling
    );
    // TODO: this function duplicates a bunch of operations, can be simplified.
    if (prevSibling === null) {
      if (nextSibling !== null) {
        const writableNextSibling = nextSibling.getWritable();
        writableParent.__first = nextSibling.__key;
        writableNextSibling.__prev = null;
      } else {
        writableParent.__first = null;
      }
    } else {
      const writablePrevSibling = prevSibling.getWritable();
      if (nextSibling !== null) {
        const writableNextSibling = nextSibling.getWritable();
        writableNextSibling.__prev = writablePrevSibling.__key;
        writablePrevSibling.__next = writableNextSibling.__key;
      } else {
        writablePrevSibling.__next = null;
      }
      writableNode.__prev = null;
    }
    if (nextSibling === null) {
      if (prevSibling !== null) {
        const writablePrevSibling = prevSibling.getWritable();
        writableParent.__last = prevSibling.__key;
        writablePrevSibling.__next = null;
      } else {
        writableParent.__last = null;
      }
    } else {
      const writableNextSibling = nextSibling.getWritable();
      if (prevSibling !== null) {
        const writablePrevSibling = prevSibling.getWritable();
        writablePrevSibling.__next = writableNextSibling.__key;
        writableNextSibling.__prev = writablePrevSibling.__key;
      } else {
        writableNextSibling.__prev = null;
      }
      writableNode.__next = null;
    }
    writableParent.__size--;
    writableNode.__parent = null;
  }
}

export function DFS(stateDepGraph, curNodeKey, stateNodeMappings, visited) {
  let nodeMappings = JSON.parse(JSON.stringify(stateNodeMappings));
  let depGraph = JSON.parse(JSON.stringify(stateDepGraph));

  visited.push(curNodeKey);

  const curNode = depGraph[curNodeKey];

  // curNodeKey should not appear in the nodeMapping because there is no relation yet
  // usually the root key's isImplemented is True, so it will not enter into this if statement
  if (!(curNodeKey in Object.keys(nodeMappings)) && !curNode["isImplemented"]) {
    // Only add lexical node when the corrresponding flow node is not implemented in the editor (which means it is newly added)

    // console.log(nodeMappings)
    // console.log('curNode parent: ', curNode['parent'])
    let parentNode = null;
    if (curNode["type"] !== "root") {
      parentNode = $getNodeByKey(nodeMappings[curNode["parent"]]);
      // console.log('parent key: ', nodeMappings[curNode['parent']])
      if (parentNode === undefined) {
        console.log("Cannot found parent node in editor");
        return;
      }
    }

    // curNode["text"] is the GPT generated text
    const hlNode = $createHighlightDepNode(
      "highlight-dep-elb",
      curNode["text"]
    );
    // hlNode.setStyle(`background-color: ${randomizeBGColor()}`)

    const textBlockNode = $createTextBlockNode();

    switch (curNode["type"]) {
      case "featuredBy":
        // get parent node
        hlNode.setStyle(`background-color: ${colorMapping["featuredBy"]}`);
        textBlockNode.append(hlNode);
        textBlockNode.append($createTextNode("  "));
        if ($isTextNode(parentNode)) {
          // the beginning sentence is text node now (it later changes to text block node)
          parentNode.insertAfter(textBlockNode);
          // textBlockNode.append($createTextNode('123'))
        } else {
          parentNode.append(textBlockNode);
          parentNode.append($createTextNode(" "));
        }
        break;
      case "elaboratedBy":
        if ($isTextNode(parentNode)) {
          const TBNode = parentNode.getParent();
          // console.log('textBlockKey, TBNode: ', textBlockKey, TBNode)
          hlNode.setStyle(`background-color: ${colorMapping["elaboratedBy"]}`);
          TBNode.append(hlNode);
          TBNode.append($createTextNode("  "));
          // parentNode.insertAfter(hlNode)
          // hlNode.insertAfter($createTextNode('456'))
        } else {
          hlNode.setStyle(`background-color: ${colorMapping["elaboratedBy"]}`);
          parentNode.append(hlNode);
          parentNode.append($createTextNode("789"));
        }
        break;
      case "attackedBy":
        hlNode.setStyle(`background-color: ${colorMapping["attackedBy"]}`);
        if ($isTextNode(parentNode)) {
          const TBNode = parentNode.getParent();
          TBNode.append(hlNode);
          TBNode.append($createTextNode("  "));
        } else {
          parentNode.append(hlNode);
          parentNode.append($createTextNode(" "));
        }
        break;
      case "root":
        const rootNode = $getRoot();
        hlNode.setStyle(`background-color: ${colorMapping["root"]}`);
        textBlockNode.append(hlNode);
        rootNode.append(textBlockNode);
        break;
      default:
        console.log(
          `node ${nodeMappings[curNodeKey]} has no valid type, type: ${curNode["type"]}`
        );
        hlNode.setStyle(`background-color: #f9c74f`);
        if ($isTextNode(parentNode)) {
          const TBNode = parentNode.getParent();
          TBNode.append(hlNode);
          TBNode.append($createTextNode("  "));
        } else {
          parentNode.append(hlNode);
          parentNode.append($createTextNode(" "));
        }
    }
    curNode["isImplemented"] = true;
    depGraph[curNodeKey] = curNode;
    // Add to nodeMappings !!!!!!!!
    nodeMappings[curNodeKey] = hlNode.getKey();
  } else if (curNode["needsUpdate"]) {
    // Update the text node
    const hlNode = $getNodeByKey(nodeMappings[curNodeKey]);
    hlNode.setTextContent(curNode["text"]);
    curNode["needsUpdate"] = false;
    depGraph[curNodeKey] = curNode;
  }

  for (const childKey of curNode["children"]) {
    if (!visited.includes(childKey)) {
      const { newNodeMappings, newDepGraph } = DFS(
        depGraph,
        childKey,
        nodeMappings,
        visited
      );
      nodeMappings = newNodeMappings;
      depGraph = newDepGraph;
    }
  }

  return { newNodeMappings: nodeMappings, newDepGraph: depGraph };
}

export function addGenartionsToEditor(
  stateDepGraph,
  rootFlowKeys,
  stateNodeMappings
) {
  let nodeMappings = JSON.parse(JSON.stringify(stateNodeMappings));
  let depGraph = JSON.parse(JSON.stringify(stateDepGraph));

  const visited = [];

  for (const rootFlowKey of rootFlowKeys) {
    const { newNodeMappings, newDepGraph } = DFS(
      depGraph,
      rootFlowKey,
      nodeMappings,
      visited
    );
    nodeMappings = newNodeMappings;
    depGraph = newDepGraph;
  }

  // add line break after each text block
  const root = $getRoot();
  const children = root.getChildren();
  children.forEach((child) => {
    if ($isParagraphNode(child)) {
      const pChildren = child.getChildren();
      pChildren.forEach((pChild) => {
        if ($isTextBlockNode(pChild)) {
          const linebreakNode1 = $createLineBreakNode();
          const linebreakNode2 = $createLineBreakNode();
          pChild.append(linebreakNode1); // change a new line
          pChild.append(linebreakNode2); // add one blank line
        }
      });
    }
  });

  console.log("updatedDepGraph: ", depGraph);

  return { updatedMappings: nodeMappings, updatedGraph: depGraph };
}

export function addGenartionsToEditorBFS(
  stateDepGraph,
  rootFlowKeys,
  stateNodeMappings
) {
  // nodeMappings: { flowNodeKey: editorNodeKey }

  let nodeMappings = JSON.parse(JSON.stringify(stateNodeMappings));
  let depGraph = JSON.parse(JSON.stringify(stateDepGraph));
  // const depRoot = depGraph[rootFlowKey]

  // if (depRoot === undefined) {
  //   console.log(
  //     '[addGenartionsToEditor] depRoot or depRoot is undefined, rootFlowKey: ',
  //     rootFlowKey
  //   )
  //   return
  // }

  const queue = [...rootFlowKeys];
  const visited = [];
  // Perform BFS to add text nodes
  while (queue.length > 0) {
    const curNodeKey = queue.shift();
    if (!visited.includes(curNodeKey)) {
      visited.push(curNodeKey);
      console.log("curNodeKey: ", curNodeKey);
      // console.log("depGraph: ", depGraph)
      const curNode = depGraph[curNodeKey];
      queue.push(...curNode.children);
      if (
        !(curNodeKey in Object.keys(nodeMappings)) &&
        !curNode["isImplemented"]
      ) {
        // Only add lexical node when the corrresponding flow node is not implemented in the editor (which means it is newly added)

        console.log(nodeMappings);
        console.log("curNode parent: ", curNode["parent"]);
        const parentNode = $getNodeByKey(nodeMappings[curNode["parent"]]);
        console.log("parent key: ", nodeMappings[curNode["parent"]]);
        if (parentNode === undefined) {
          console.log("Cannot found parent node in editor");
          continue;
        }

        const hlNode = $createHighlightDepNode(
          "highlight-dep-elb",
          curNode["text"]
        );
        // hlNode.setStyle(`background-color: ${randomizeBGColor()}`)

        switch (curNode["type"]) {
          case "featuredBy":
            // Add a new textBlock Node
            const textBlockNode = $createTextBlockNode();
            // get parent node
            hlNode.setStyle(`background-color: ${colorMapping["featuredBy"]}`);
            textBlockNode.append(hlNode);
            textBlockNode.append($createTextNode("  "));
            if ($isTextNode(parentNode)) {
              parentNode.insertAfter(textBlockNode);
              // textBlockNode.append($createTextNode('123'))
            } else {
              parentNode.append(textBlockNode);
              parentNode.append($createTextNode(" "));
            }
            break;
          case "elaboratedBy":
            if ($isTextNode(parentNode)) {
              const TBNode = parentNode.getParent();
              // console.log('textBlockKey, TBNode: ', textBlockKey, TBNode)
              hlNode.setStyle(
                `background-color: ${colorMapping["elaboratedBy"]}`
              );
              TBNode.append(hlNode);
              TBNode.append($createTextNode("  "));
              // parentNode.insertAfter(hlNode)
              // hlNode.insertAfter($createTextNode('456'))
            } else {
              hlNode.setStyle(
                `background-color: ${colorMapping["elaboratedBy"]}`
              );
              parentNode.append(hlNode);
              parentNode.append($createTextNode("789"));
            }
            break;
          case "attackedBy":
            hlNode.setStyle(`background-color: ${colorMapping["attackedBy"]}`);
            if ($isTextNode(parentNode)) {
              const TBNode = parentNode.getParent();
              TBNode.append(hlNode);
              TBNode.append($createTextNode("  "));
            } else {
              parentNode.append(hlNode);
              parentNode.append($createTextNode(" "));
            }
            break;
          default:
            console.log(
              `node ${nodeMappings[curNodeKey]} has no valid type, type: ${curNode["type"]}`
            );
            hlNode.setStyle(`background-color: #f9c74f`);
            if ($isTextNode(parentNode)) {
              const TBNode = parentNode.getParent();
              TBNode.append(hlNode);
              TBNode.append($createTextNode("  "));
            } else {
              parentNode.append(hlNode);
              parentNode.append($createTextNode(" "));
            }
        }
        curNode["isImplemented"] = true;
        depGraph[curNodeKey] = curNode;
        // Add to nodeMappings
        nodeMappings[curNodeKey] = hlNode.getKey();
      } else if (curNode["needsUpdate"]) {
        // Update the text node
        const hlNode = $getNodeByKey(nodeMappings[curNodeKey]);
        hlNode.setTextContent(curNode["text"]);
        curNode["needsUpdate"] = false;
        depGraph[curNodeKey] = curNode;
      }
    }
  }

  // add line break after each text block
  const root = $getRoot();
  const children = root.getChildren();
  children.forEach((child) => {
    if ($isParagraphNode(child)) {
      const pChildren = child.getChildren();
      pChildren.forEach((pChild) => {
        if ($isTextBlockNode(pChild)) {
          const linebreakNode1 = $createLineBreakNode();
          const linebreakNode2 = $createLineBreakNode();
          pChild.append(linebreakNode1);
          pChild.append(linebreakNode2);
        }
      });
    }
  });

  return { updatedMappings: nodeMappings, updatedGraph: depGraph };
}

export function addGenerationsFromSketch(editor, res, type, curRangeNodeKey) {
  // res format: res = { globalContext: ..., keywords: ..., generations: ... }
  const keywords = res["keywords"];
  const generations = res["generations"];
  const globalContext = res["globalContext"];
  const depGraph = res["depGraph"];
  const discussionPoints = res["discussionPoints"];
  const startSents = res["startSents"];

  const flowNodes = {};

  let anchorNode = $getNodeByKey(curRangeNodeKey);

  if (anchorNode === null) {
    console.log("[addGenerationsFromSketch] anchorNode is null");
    return;
  }

  keywords.forEach((keyword) => {
    // Add two line break nodes
    const linebreakNode1 = $createLineBreakNode();
    anchorNode.insertAfter(linebreakNode1);
    anchorNode = linebreakNode1;

    const linebreakNode2 = $createLineBreakNode();
    anchorNode.insertAfter(linebreakNode2);
    anchorNode = linebreakNode2;

    if (type === "elaborate" && startSents[keyword] !== undefined) {
      console.log("startSent:");
      console.log(startSents);

      const startSent = startSents[keyword].replaceAll("\n", "");

      const startSentNode = $createHighlightDepNode(
        "highlight-dep-elb",
        startSent
      );
      startSentNode.setStyle(`background-color: ${randomizeBGColor()}`);
      anchorNode.insertAfter(startSentNode);
      anchorNode = startSentNode;
    }

    depGraph[keyword].forEach((dp) => {
      const { content } = dp;

      const DPNode = $createTextNode("[" + content + "]");

      anchorNode.insertAfter(DPNode);
      anchorNode = DPNode;

      const textBlockNode = $createTextBlockNode();

      const textNode = $createHighlightDepNode(
        "highlight-dep-elb",
        generations[content].replaceAll("\n", "")
      );
      textNode.setStyle(`background-color: ${randomizeBGColor()}`);
      flowNodes[textNode.getKey()] = content;
      textBlockNode.append(textNode);

      anchorNode.insertAfter(textBlockNode);
      anchorNode = textBlockNode;
    });
  });
  // })
  editor.dispatchCommand(SHOW_LOADING_COMMAND, { show: false });
  return flowNodes;
}

export function highlightDepText(editor, res) {
  var search_strs = [];

  res = [...new Set(res)];

  res.forEach((element) => {
    editor.update(() => {
      const dep_node = element.get("n2");
      const rel = element.get("r");
      let dep_text = dep_node.properties.content;
      if (dep_text.charAt(0) === " ") {
        dep_text = dep_text.substring(1);
      }

      search_strs.push({ text: dep_text, rel_type: rel.type });
    });
  });

  editor.update(() => {
    const children = $getRoot().getChildren();
    for (const child of children) {
      if (!$isParagraphNode(child)) {
        continue;
      }
      const paragraphNode = child;
      const text = child.getTextContent();

      const indexes = [];
      let result;

      search_strs.forEach((e) => {
        const searchStr = String(e.text)
          .replace("{", "{")
          .replace("}", "}")
          .replace("(", "(")
          .replace(")", ")")
          .replace(".", ".")
          .replace(/\\/g, "\\\\");
        const searchStrLen = searchStr.length;
        const regex = new RegExp(searchStr, "gim");

        while ((result = regex.exec(text)) !== null) {
          indexes.push({
            start: result.index,
            end: result.index + searchStrLen,
            rel_type: e.rel_type,
          });
        }
      });

      if (indexes.length === 0) {
        continue;
      }

      // console.log(indexes)

      paragraphNode.clear();

      const chunks = [];

      if (indexes[0].start !== 0) {
        chunks.push({ start: 0, end: indexes[0].start, rel_type: undefined });
      }

      for (let i = 0; i < indexes.length; i++) {
        chunks.push({
          start: indexes[i].start,
          end: indexes[i].end,
          rel_type: indexes[i].rel_type,
        });

        if (i < indexes.length - 1 && indexes[i].end !== indexes[i + 1].start) {
          chunks.push({
            start: indexes[i].end,
            end: indexes[i + 1].start,
            rel_type: undefined,
          });
        }
      }

      if (chunks.at(-1).end !== text.length) {
        chunks.push({
          start: indexes.at(-1).end,
          end: text.length,
          rel_type: undefined,
        });
      }

      // console.log(chunks)

      for (let i = 0; i < chunks.length; i++) {
        var textNode;
        if (chunks[i].rel_type === "elaboratedBy") {
          textNode = $createHighlightDepNode(
            "highlight-dep-elb",
            text.slice(chunks[i].start, chunks[i].end)
          );
        } else {
          textNode = $createTextNode(
            text.slice(chunks[i].start, chunks[i].end)
          );
        }
        paragraphNode.append(textNode);
      }
    }
  });
}

export function highlightCertainText() {}

export function removeChildrenNodeFromDepGraph(
  dependencyGraph,
  nodeMappings,
  delNodeKey
) {
  if (dependencyGraph[delNodeKey]["children"].length === 0) {
    return;
  }

  dependencyGraph[delNodeKey]["children"].forEach((child) => {
    if (
      dependencyGraph[child] !== undefined &&
      nodeMappings[child] !== undefined
    ) {
      removeChildrenNodeFromDepGraph(dependencyGraph, nodeMappings, child);
      delete dependencyGraph[child];
      delete nodeMappings[child];
    }
  });
}

export function filterNodesByClassName(editor, nodes, attribute) {
  // Filter nodes that are element nodes and have a corresponding DOM element
  const paragraphNodes = nodes.filter((node) => {
    if ($isElementNode(node) && node.getType() === "paragraph") {
      const domElement = editor.getElementByKey(node.getKey());
      console.log(
        "domElement ",
        domElement,
        domElement.hasAttribute(attribute)
      );
      return domElement && domElement.hasAttribute(attribute);
    }
    return false;
  });

  return paragraphNodes;
}

export function DFSGetText(node) {
  if ($isTextNode(node)) return [node.getTextContent()];

  const texts = [];
  const children = node.getChildren();
  for (const child of children) {
    const text = DFSGetText(child);
    texts.push(...text);
  }

  return texts;
}

export function addThesisToEditor(
  thesisText,
  firstKeyPointNode,
  nodeMappings,
  depGraph
) {
  // find the newly added flow node key
  let thesisFlowNodeKey = null;
  for (const [key, value] of Object.entries(depGraph)) {
    if (!(key in nodeMappings) && value.type === "root") {
      thesisFlowNodeKey = key;
    }
  }

  if (thesisFlowNodeKey === null)
    console.log("[utils] cannot find the thesis root key");

  // find the parent container (the paragraph node)
  let parentContainer = firstKeyPointNode;
  while (!$isParagraphNode(parentContainer)) {
    parentContainer = parentContainer.getParent();
  }

  // first create the thesis node
  const textBlockNode = $createTextBlockNode();
  const hlThesisNode = $createHighlightDepNode("highlight-dep-elb", thesisText);
  hlThesisNode.setStyle(`background-color: ${colorMapping["root"]}`);
  textBlockNode.append(hlThesisNode);
  textBlockNode.append($createTextNode("  "));
  // add the mapping between flow node and editor node
  nodeMappings[thesisFlowNodeKey] = hlThesisNode.getKey();

  // then insert it to the beginning of the parent container
  const originalBeginningNode = parentContainer.getFirstChild();
  originalBeginningNode.insertBefore(textBlockNode);

  return nodeMappings;
}

// the editor node key is not consistent every time after parsing,
// so the following two functions are used to serialize and deserialize the states
// NOT Working...
export function getEditorStateWithKeys(editorState) {
  const jsonState = editorState.toJSON();
  const nodeMap = editorState._nodeMap;
  const serializedState = { ...jsonState, nodeKeyMap: {} };

  nodeMap.forEach((node, key) => {
    serializedState.nodeKeyMap[key] = node.exportJSON();
  });
  console.log(
    "[util get editor state with keys] nodeKeyMap ",
    serializedState.nodeKeyMap
  );

  return serializedState;
}

export function parseEditorStateWithKeys(editor, serializedState) {
  const { nodeKeyMap, ...jsonState } = serializedState;

  const editorState = editor.parseEditorState(jsonState);

  console.log(
    "[until parse editor state with keys] editor state's map ",
    editorState._nodeMap
  );

  console.log("_nodeMap is map ", editorState._nodeMap instanceof Map); // Should log true

  const newNodeMap = new Map();
  Object.entries(nodeKeyMap).forEach(([key, nodeJson]) => {
    console.log(
      "[util] parseEditorStateWithKeys: key nodeJson: ",
      key,
      nodeJson
    );
    let node = null;
    switch (nodeJson.type) {
      case "paragraph":
        node = ParagraphNode.importJSON(nodeJson);
        break;
      case "text":
        node = TextNode.importJSON(nodeJson);
        break;
      case "root":
        node = RootNode.importJSON(nodeJson);
        break;
      case "hl-text":
        node = HighlightDepNode.importJSON(nodeJson);
        break;
      case "textBlock":
        node = TextBlockNode.importJSON(nodeJson);
        break;
      case "linebreak":
        node = LineBreakNode.importJSON(nodeJson);
        break;
      default:
        console.log("unknown node type:", nodeJson.type);
        break;
    }
    newNodeMap.set(key, node);
  });
  console.log(
    "[until parse editor state with keys] new node map is ",
    newNodeMap
  );

  editorState._nodeMap = newNodeMap;

  return editorState;
}

export function assignNewEditorNodeKeyToMapping(
  editorStateNodeMap,
  dependencyGraph,
  flowEditorNodeMapping
) {
  flowEditorNodeMapping = JSON.parse(JSON.stringify(flowEditorNodeMapping))
  console.log("[assign new key to mapping] dependency graph is ", dependencyGraph)

  for (const [newEditorKey, editorNode] of editorStateNodeMap) {
    if ($isHighlightDepNode(editorNode)) {
      console.log(
        "[assign new key to mapping]highlight node key is ",
        newEditorKey
      );
      let flowKey = null;
      for (const [key, value] of Object.entries(dependencyGraph)) {
        if (value.text === editorNode.__text) {
          flowKey = key;
          break;
        }
      }

      if (flowKey === null) {
        console.log("cannot find the flow key that has the same text content");
      }

      if (flowKey in flowEditorNodeMapping) {
        flowEditorNodeMapping[flowKey] = newEditorKey;
      } else {
        console.log("cannot find the flow node key in the node mapping");
      }
    }
  }

  console.log("the new flow editor node mapping is ", flowEditorNodeMapping);

  return flowEditorNodeMapping;
}
