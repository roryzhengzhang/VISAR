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
  $hasAncestor
} from 'lexical'
import { SHOW_LOADING_COMMAND } from './commands/SelfDefinedCommands'
import { $createHighlightDepNode } from './nodes/HighlightDepNode'
import { useDispatch } from 'react-redux'
import { $createTextBlockNode, $isTextBlockNode } from './nodes/TextBlockNode'
import { cyan, teal, pink, amber, blue, purple } from '@mui/material/colors'

function randomizeBGColor () {
  const colors = [
    '#b0f2b4',
    '#baf2e9',
    '#f2bac9',
    '#cdc1ff',
    '#ffc300',
    '#d6e2e9',
    '#ffb3c1',
    '#f9c74f'
  ]
  const id = Math.floor(Math.random() * colors.length)

  return '#ffb3c1'
}

export const colorMapping = {
  attackedBy: '#ff758f',
  elaboratedBy: '#ffd60a',
  featuredBy: '#e2afff',
  supportedBy: '#83c5be',
  root: '#bde0fe'
}

export function positionFloatingButton (buttonGroup, rect) {
  if (rect === null) {
    buttonGroup.style.opacity = '0'
    buttonGroup.style.top = '-1000px'
    buttonGroup.style.left = '-1000px'
  } else {
    buttonGroup.style.opacity = '1'
    buttonGroup.style.top = `${
      rect.top + rect.height + window.pageYOffset + 10
    }px`
    buttonGroup.style.left = `${Math.max(
      rect.left +
        window.pageXOffset -
        buttonGroup.offsetWidth / 2 +
        rect.width / 2,
      10
    )}px`
  }
}

export function $maybeMoveChildrenSelectionToParent (parentNode, offset = 0) {
  if (offset !== 0) {
  }
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !$isElementNode(parentNode)) {
    return selection
  }
  const { anchor, focus } = selection
  const anchorNode = anchor.getNode()
  const focusNode = focus.getNode()
  if ($hasAncestor(anchorNode, parentNode)) {
    anchor.set(parentNode.__key, 0, 'element')
  }
  if ($hasAncestor(focusNode, parentNode)) {
    focus.set(parentNode.__key, 0, 'element')
  }
  return selection
}

export function moveSelectionPointToSibling (
  point,
  node,
  parent,
  prevSibling,
  nextSibling
) {
  let siblingKey = null
  let offset = 0
  let type = null
  if (prevSibling !== null) {
    siblingKey = prevSibling.__key
    if ($isTextNode(prevSibling)) {
      offset = prevSibling.getTextContentSize()
      type = 'text'
    } else if ($isElementNode(prevSibling)) {
      offset = prevSibling.getChildrenSize()
      type = 'element'
    }
  } else {
    if (nextSibling !== null) {
      siblingKey = nextSibling.__key
      if ($isTextNode(nextSibling)) {
        type = 'text'
      } else if ($isElementNode(nextSibling)) {
        type = 'element'
      }
    }
  }
  if (siblingKey !== null && type !== null) {
    point.set(siblingKey, offset, type)
  } else {
    offset = node.getIndexWithinParent()
    if (offset === -1) {
      // Move selection to end of parent
      offset = parent.getChildrenSize()
    }
    point.set(parent.__key, offset, 'element')
  }
}
export function $updateElementSelectionOnCreateDeleteNode (
  selection,
  parentNode,
  nodeOffset,
  times = 1
) {
  const anchor = selection.anchor
  const focus = selection.focus
  const anchorNode = anchor.getNode()
  const focusNode = focus.getNode()
  if (!parentNode.is(anchorNode) && !parentNode.is(focusNode)) {
    return
  }
  const parentKey = parentNode.__key
  // Single node. We shift selection but never redimension it
  if (selection.isCollapsed()) {
    const selectionOffset = anchor.offset
    if (nodeOffset <= selectionOffset) {
      const newSelectionOffset = Math.max(0, selectionOffset + times)
      anchor.set(parentKey, newSelectionOffset, 'element')
      focus.set(parentKey, newSelectionOffset, 'element')
      // The new selection might point to text nodes, try to resolve them
      $updateSelectionResolveTextNodes(selection)
    }
    return
  }
  // Multiple nodes selected. We shift or redimension selection
  const isBackward = selection.isBackward()
  const firstPoint = isBackward ? focus : anchor
  const firstPointNode = firstPoint.getNode()
  const lastPoint = isBackward ? anchor : focus
  const lastPointNode = lastPoint.getNode()
  if (parentNode.is(firstPointNode)) {
    const firstPointOffset = firstPoint.offset
    if (nodeOffset <= firstPointOffset) {
      firstPoint.set(
        parentKey,
        Math.max(0, firstPointOffset + times),
        'element'
      )
    }
  }
  if (parentNode.is(lastPointNode)) {
    const lastPointOffset = lastPoint.offset
    if (nodeOffset <= lastPointOffset) {
      lastPoint.set(parentKey, Math.max(0, lastPointOffset + times), 'element')
    }
  }
  // The new selection might point to text nodes, try to resolve them
  $updateSelectionResolveTextNodes(selection)
}

function $updateSelectionResolveTextNodes (selection) {
  const anchor = selection.anchor
  const anchorOffset = anchor.offset
  const focus = selection.focus
  const focusOffset = focus.offset
  const anchorNode = anchor.getNode()
  const focusNode = focus.getNode()
  if (selection.isCollapsed()) {
    if (!$isElementNode(anchorNode)) {
      return
    }
    const childSize = anchorNode.getChildrenSize()
    const anchorOffsetAtEnd = anchorOffset >= childSize
    const child = anchorOffsetAtEnd
      ? anchorNode.getChildAtIndex(childSize - 1)
      : anchorNode.getChildAtIndex(anchorOffset)
    if ($isTextNode(child)) {
      let newOffset = 0
      if (anchorOffsetAtEnd) {
        newOffset = child.getTextContentSize()
      }
      anchor.set(child.__key, newOffset, 'text')
      focus.set(child.__key, newOffset, 'text')
    }
    return
  }
  if ($isElementNode(anchorNode)) {
    const childSize = anchorNode.getChildrenSize()
    const anchorOffsetAtEnd = anchorOffset >= childSize
    const child = anchorOffsetAtEnd
      ? anchorNode.getChildAtIndex(childSize - 1)
      : anchorNode.getChildAtIndex(anchorOffset)
    if ($isTextNode(child)) {
      let newOffset = 0
      if (anchorOffsetAtEnd) {
        newOffset = child.getTextContentSize()
      }
      anchor.set(child.__key, newOffset, 'text')
    }
  }
  if ($isElementNode(focusNode)) {
    const childSize = focusNode.getChildrenSize()
    const focusOffsetAtEnd = focusOffset >= childSize
    const child = focusOffsetAtEnd
      ? focusNode.getChildAtIndex(childSize - 1)
      : focusNode.getChildAtIndex(focusOffset)
    if ($isTextNode(child)) {
      let newOffset = 0
      if (focusOffsetAtEnd) {
        newOffset = child.getTextContentSize()
      }
      focus.set(child.__key, newOffset, 'text')
    }
  }
}

export function removeNode (
  nodeToRemove,
  restoreSelection = true,
  preserveEmptyParent = true
) {
  // errorOnReadOnly();
  const key = nodeToRemove.__key
  const parent = nodeToRemove.getParent()
  if (parent === null) {
    return
  }
  const selection = $maybeMoveChildrenSelectionToParent(nodeToRemove)
  let selectionMoved = false
  if ($isRangeSelection(selection) && restoreSelection) {
    const anchor = selection.anchor
    const focus = selection.focus
    if (anchor.key === key) {
      moveSelectionPointToSibling(
        anchor,
        nodeToRemove,
        parent,
        nodeToRemove.getPreviousSibling(),
        nodeToRemove.getNextSibling()
      )
      selectionMoved = true
    }
    if (focus.key === key) {
      moveSelectionPointToSibling(
        focus,
        nodeToRemove,
        parent,
        nodeToRemove.getPreviousSibling(),
        nodeToRemove.getNextSibling()
      )
      selectionMoved = true
    }
  }

  if ($isRangeSelection(selection) && restoreSelection && !selectionMoved) {
    // Doing this is O(n) so lets avoid it unless we need to do it
    const index = nodeToRemove.getIndexWithinParent()
    removeFromParent(nodeToRemove)
    $updateElementSelectionOnCreateDeleteNode(selection, parent, index, -1)
  } else {
    removeFromParent(nodeToRemove)
  }

  if (
    !preserveEmptyParent &&
    !$isRootOrShadowRoot(parent) &&
    !parent.canBeEmpty() &&
    parent.isEmpty()
  ) {
    removeNode(parent, restoreSelection)
  }
  if (restoreSelection && $isRootNode(parent) && parent.isEmpty()) {
    parent.selectEnd()
  }
}

export function positionTextBlockMenu (buttonGroup, loc) {
  if (loc === null) {
    buttonGroup.style.opacity = '0'
    buttonGroup.style.top = '-1000px'
    buttonGroup.style.left = '-1000px'
  } else {
    buttonGroup.style.opacity = '1'
    buttonGroup.style.top = `${loc.top}px`
    buttonGroup.style.left = `${Math.max(loc.left, 10)}px`
  }
}

export function selectTextNodeByKey (editor, nodeKey) {
  editor.update(() => {
    const targetNode = $getNodeByKey(nodeKey)
    let newSelection = $createRangeSelection()
    newSelection.focus.set(nodeKey, 0, 'text')
    newSelection.anchor.set(nodeKey, targetNode.getTextContentSize(), 'text')
    $setSelection(newSelection)
  })
}

export function removeFromParent (node) {
  const oldParent = node.getParent()
  if (oldParent !== null) {
    const writableNode = node.getWritable()
    const writableParent = oldParent.getWritable()
    const prevSibling = node.getPreviousSibling()
    const nextSibling = node.getNextSibling()
    // TODO: this function duplicates a bunch of operations, can be simplified.
    if (prevSibling === null) {
      if (nextSibling !== null) {
        const writableNextSibling = nextSibling.getWritable()
        writableParent.__first = nextSibling.__key
        writableNextSibling.__prev = null
      } else {
        writableParent.__first = null
      }
    } else {
      const writablePrevSibling = prevSibling.getWritable()
      if (nextSibling !== null) {
        const writableNextSibling = nextSibling.getWritable()
        writableNextSibling.__prev = writablePrevSibling.__key
        writablePrevSibling.__next = writableNextSibling.__key
      } else {
        writablePrevSibling.__next = null
      }
      writableNode.__prev = null
    }
    if (nextSibling === null) {
      if (prevSibling !== null) {
        const writablePrevSibling = prevSibling.getWritable()
        writableParent.__last = prevSibling.__key
        writablePrevSibling.__next = null
      } else {
        writableParent.__last = null
      }
    } else {
      const writableNextSibling = nextSibling.getWritable()
      if (prevSibling !== null) {
        const writablePrevSibling = prevSibling.getWritable()
        writablePrevSibling.__next = writableNextSibling.__key
        writableNextSibling.__prev = writablePrevSibling.__key
      } else {
        writableNextSibling.__prev = null
      }
      writableNode.__next = null
    }
    writableParent.__size--
    writableNode.__parent = null
  }
}

export function DFS (stateDepGraph, curNodeKey, stateNodeMappings, visited) {
  let nodeMappings = JSON.parse(JSON.stringify(stateNodeMappings))
  let depGraph = JSON.parse(JSON.stringify(stateDepGraph))

  visited.push(curNodeKey)

  const curNode = depGraph[curNodeKey]

  if (!(curNodeKey in Object.keys(nodeMappings)) && !curNode['isImplemented']) {
    // Only add lexical node when the corrresponding flow node is not implemented in the editor (which means it is newly added)

    // console.log(nodeMappings)
    // console.log('curNode parent: ', curNode['parent'])
    let parentNode = null
    if (curNode['type'] !== 'root') {
      parentNode = $getNodeByKey(nodeMappings[curNode['parent']])
      // console.log('parent key: ', nodeMappings[curNode['parent']])
      if (parentNode === undefined) {
        console.log('Cannot found parent node in editor')
        return
      }
    }

    const hlNode = $createHighlightDepNode('highlight-dep-elb', curNode['text'])
    // hlNode.setStyle(`background-color: ${randomizeBGColor()}`)

    const textBlockNode = $createTextBlockNode()

    switch (curNode['type']) {
      case 'featuredBy':

        // get parent node
        hlNode.setStyle(`background-color: ${colorMapping['featuredBy']}`)
        textBlockNode.append(hlNode)
        textBlockNode.append($createTextNode('  '))
        if ($isTextNode(parentNode)) {
          parentNode.insertAfter(textBlockNode)
          // textBlockNode.append($createTextNode('123'))
        } else {
          parentNode.append(textBlockNode)
          parentNode.append($createTextNode(' '))
        }
        break
      case 'elaboratedBy':
        if ($isTextNode(parentNode)) {
          const TBNode = parentNode.getParent()
          // console.log('textBlockKey, TBNode: ', textBlockKey, TBNode)
          hlNode.setStyle(`background-color: ${colorMapping['elaboratedBy']}`)
          TBNode.append(hlNode)
          TBNode.append($createTextNode('  '))
          // parentNode.insertAfter(hlNode)
          // hlNode.insertAfter($createTextNode('456'))
        } else {
          hlNode.setStyle(`background-color: ${colorMapping['elaboratedBy']}`)
          parentNode.append(hlNode)
          parentNode.append($createTextNode('789'))
        }
        break
      case 'attackedBy':
        hlNode.setStyle(`background-color: ${colorMapping['attackedBy']}`)
        if ($isTextNode(parentNode)) {
          const TBNode = parentNode.getParent()
          TBNode.append(hlNode)
          TBNode.append($createTextNode('  '))
        } else {
          parentNode.append(hlNode)
          parentNode.append($createTextNode(' '))
        }
        break
      case 'root':
        const rootNode = $getRoot()
        hlNode.setStyle(`background-color: ${colorMapping['root']}`)
        textBlockNode.append(hlNode)
        rootNode.append(textBlockNode)
        break
      default:
        console.log(
          `node ${nodeMappings[curNodeKey]} has no valid type, type: ${curNode['type']}`
        )
        hlNode.setStyle(`background-color: #f9c74f`)
        if ($isTextNode(parentNode)) {
          const TBNode = parentNode.getParent()
          TBNode.append(hlNode)
          TBNode.append($createTextNode('  '))
        } else {
          parentNode.append(hlNode)
          parentNode.append($createTextNode(' '))
        }
    }
    curNode['isImplemented'] = true
    depGraph[curNodeKey] = curNode
    // Add to nodeMappings
    nodeMappings[curNodeKey] = hlNode.getKey()
  } else if (curNode['needsUpdate']) {
    // Update the text node
    const hlNode = $getNodeByKey(nodeMappings[curNodeKey])
    hlNode.setTextContent(curNode['text'])
    curNode['needsUpdate'] = false
    depGraph[curNodeKey] = curNode
  }

  for (const childKey of curNode['children']) {
    if (!visited.includes(childKey)) {
      const { newNodeMappings, newDepGraph } = DFS(depGraph, childKey, nodeMappings, visited)
      nodeMappings = newNodeMappings
      depGraph = newDepGraph
    }
  }

  return { newNodeMappings: nodeMappings, newDepGraph: depGraph }
}

export function addGenartionsToEditor (
  stateDepGraph,
  rootFlowKeys,
  stateNodeMappings
) {
  let nodeMappings = JSON.parse(JSON.stringify(stateNodeMappings))
  let depGraph = JSON.parse(JSON.stringify(stateDepGraph))

  const visited = []

  for (const rootFlowKey of rootFlowKeys) {
    const { newNodeMappings, newDepGraph } = DFS(depGraph, rootFlowKey, nodeMappings, visited)
    nodeMappings = newNodeMappings
    depGraph = newDepGraph
  }

  // add line break after each text block
  const root = $getRoot()
  const children = root.getChildren()
  children.forEach(child => {
    if ($isParagraphNode(child)) {
      const pChildren = child.getChildren()
      pChildren.forEach(pChild => {
        if ($isTextBlockNode(pChild)) {
          const linebreakNode1 = $createLineBreakNode()
          const linebreakNode2 = $createLineBreakNode()
          pChild.append(linebreakNode1)
          pChild.append(linebreakNode2)
        }
      })
    }
  })

  console.log("updatedDepGraph: ", depGraph)

  return { updatedMappings: nodeMappings, updatedGraph: depGraph } 
}

export function addGenartionsToEditorBFS (
  stateDepGraph,
  rootFlowKeys,
  stateNodeMappings
) {
  // nodeMappings: { flowNodeKey: editorNodeKey }

  let nodeMappings = JSON.parse(JSON.stringify(stateNodeMappings))
  let depGraph = JSON.parse(JSON.stringify(stateDepGraph))
  // const depRoot = depGraph[rootFlowKey]

  // if (depRoot === undefined) {
  //   console.log(
  //     '[addGenartionsToEditor] depRoot or depRoot is undefined, rootFlowKey: ',
  //     rootFlowKey
  //   )
  //   return
  // }

  const queue = [...rootFlowKeys]
  const visited = []
  // Perform BFS to add text nodes
  while (queue.length > 0) {
    const curNodeKey = queue.shift()
    if (!visited.includes(curNodeKey)) {
      visited.push(curNodeKey)
      console.log('curNodeKey: ', curNodeKey)
      // console.log("depGraph: ", depGraph)
      const curNode = depGraph[curNodeKey]
      queue.push(...curNode.children)
      if (
        !(curNodeKey in Object.keys(nodeMappings)) &&
        !curNode['isImplemented']
      ) {
        // Only add lexical node when the corrresponding flow node is not implemented in the editor (which means it is newly added)

        console.log(nodeMappings)
        console.log('curNode parent: ', curNode['parent'])
        const parentNode = $getNodeByKey(nodeMappings[curNode['parent']])
        console.log('parent key: ', nodeMappings[curNode['parent']])
        if (parentNode === undefined) {
          console.log('Cannot found parent node in editor')
          continue
        }

        const hlNode = $createHighlightDepNode(
          'highlight-dep-elb',
          curNode['text']
        )
        // hlNode.setStyle(`background-color: ${randomizeBGColor()}`)

        switch (curNode['type']) {
          case 'featuredBy':
            // Add a new textBlock Node
            const textBlockNode = $createTextBlockNode()
            // get parent node
            hlNode.setStyle(`background-color: ${colorMapping['featuredBy']}`)
            textBlockNode.append(hlNode)
            textBlockNode.append($createTextNode('  '))
            if ($isTextNode(parentNode)) {
              parentNode.insertAfter(textBlockNode)
              // textBlockNode.append($createTextNode('123'))
            } else {
              parentNode.append(textBlockNode)
              parentNode.append($createTextNode(' '))
            }
            break
          case 'elaboratedBy':
            if ($isTextNode(parentNode)) {
              const TBNode = parentNode.getParent()
              // console.log('textBlockKey, TBNode: ', textBlockKey, TBNode)
              hlNode.setStyle(
                `background-color: ${colorMapping['elaboratedBy']}`
              )
              TBNode.append(hlNode)
              TBNode.append($createTextNode('  '))
              // parentNode.insertAfter(hlNode)
              // hlNode.insertAfter($createTextNode('456'))
            } else {
              hlNode.setStyle(
                `background-color: ${colorMapping['elaboratedBy']}`
              )
              parentNode.append(hlNode)
              parentNode.append($createTextNode('789'))
            }
            break
          case 'attackedBy':
            hlNode.setStyle(`background-color: ${colorMapping['attackedBy']}`)
            if ($isTextNode(parentNode)) {
              const TBNode = parentNode.getParent()
              TBNode.append(hlNode)
              TBNode.append($createTextNode('  '))
            } else {
              parentNode.append(hlNode)
              parentNode.append($createTextNode(' '))
            }
            break
          default:
            console.log(
              `node ${nodeMappings[curNodeKey]} has no valid type, type: ${curNode['type']}`
            )
            hlNode.setStyle(`background-color: #f9c74f`)
            if ($isTextNode(parentNode)) {
              const TBNode = parentNode.getParent()
              TBNode.append(hlNode)
              TBNode.append($createTextNode('  '))
            } else {
              parentNode.append(hlNode)
              parentNode.append($createTextNode(' '))
            }
        }
        curNode['isImplemented'] = true
        depGraph[curNodeKey] = curNode
        // Add to nodeMappings
        nodeMappings[curNodeKey] = hlNode.getKey()
      } else if (curNode['needsUpdate']) {
        // Update the text node
        const hlNode = $getNodeByKey(nodeMappings[curNodeKey])
        hlNode.setTextContent(curNode['text'])
        curNode['needsUpdate'] = false
        depGraph[curNodeKey] = curNode
      }
    }
  }

  // add line break after each text block
  const root = $getRoot()
  const children = root.getChildren()
  children.forEach(child => {
    if ($isParagraphNode(child)) {
      const pChildren = child.getChildren()
      pChildren.forEach(pChild => {
        if ($isTextBlockNode(pChild)) {
          const linebreakNode1 = $createLineBreakNode()
          const linebreakNode2 = $createLineBreakNode()
          pChild.append(linebreakNode1)
          pChild.append(linebreakNode2)
        }
      })
    }
  })

  return { updatedMappings: nodeMappings, updatedGraph: depGraph }
}

export function addGenerationsFromSketch (editor, res, type, curRangeNodeKey) {
  // res format: res = { globalContext: ..., keywords: ..., generations: ... }
  const keywords = res['keywords']
  const generations = res['generations']
  const globalContext = res['globalContext']
  const depGraph = res['depGraph']
  const discussionPoints = res['discussionPoints']
  const startSents = res['startSents']

  const flowNodes = {}

  let anchorNode = $getNodeByKey(curRangeNodeKey)

  if (anchorNode === null) {
    console.log('[addGenerationsFromSketch] anchorNode is null')
    return
  }

  keywords.forEach(keyword => {
    // Add two line break nodes
    const linebreakNode1 = $createLineBreakNode()
    anchorNode.insertAfter(linebreakNode1)
    anchorNode = linebreakNode1

    const linebreakNode2 = $createLineBreakNode()
    anchorNode.insertAfter(linebreakNode2)
    anchorNode = linebreakNode2

    if (type === 'elaborate' && startSents[keyword] !== undefined) {
      console.log('startSent:')
      console.log(startSents)

      const startSent = startSents[keyword].replaceAll('\n', '')

      const startSentNode = $createHighlightDepNode(
        'highlight-dep-elb',
        startSent
      )
      startSentNode.setStyle(`background-color: ${randomizeBGColor()}`)
      anchorNode.insertAfter(startSentNode)
      anchorNode = startSentNode
    }

    depGraph[keyword].forEach(dp => {
      const { content } = dp

      const DPNode = $createTextNode('[' + content + ']')

      anchorNode.insertAfter(DPNode)
      anchorNode = DPNode

      const textBlockNode = $createTextBlockNode()

      const textNode = $createHighlightDepNode(
        'highlight-dep-elb',
        generations[content].replaceAll('\n', '')
      )
      textNode.setStyle(`background-color: ${randomizeBGColor()}`)
      flowNodes[textNode.getKey()] = content
      textBlockNode.append(textNode)

      anchorNode.insertAfter(textBlockNode)
      anchorNode = textBlockNode
    })
  })
  // })
  editor.dispatchCommand(SHOW_LOADING_COMMAND, { show: false })
  return flowNodes
}

export function highlightDepText (editor, res) {
  var search_strs = []

  res = [...new Set(res)]

  res.forEach(element => {
    editor.update(() => {
      const dep_node = element.get('n2')
      const rel = element.get('r')
      let dep_text = dep_node.properties.content
      if (dep_text.charAt(0) === ' ') {
        dep_text = dep_text.substring(1)
      }

      search_strs.push({ text: dep_text, rel_type: rel.type })
    })
  })

  editor.update(() => {
    const children = $getRoot().getChildren()
    for (const child of children) {
      if (!$isParagraphNode(child)) {
        continue
      }
      const paragraphNode = child
      const text = child.getTextContent()

      const indexes = []
      let result

      search_strs.forEach(e => {
        const searchStr = String(e.text)
          .replace('{', '{')
          .replace('}', '}')
          .replace('(', '(')
          .replace(')', ')')
          .replace('.', '.')
          .replace(/\\/g, '\\\\')
        const searchStrLen = searchStr.length
        const regex = new RegExp(searchStr, 'gim')

        while ((result = regex.exec(text)) !== null) {
          indexes.push({
            start: result.index,
            end: result.index + searchStrLen,
            rel_type: e.rel_type
          })
        }
      })

      if (indexes.length === 0) {
        continue
      }

      // console.log(indexes)

      paragraphNode.clear()

      const chunks = []

      if (indexes[0].start !== 0) {
        chunks.push({ start: 0, end: indexes[0].start, rel_type: undefined })
      }

      for (let i = 0; i < indexes.length; i++) {
        chunks.push({
          start: indexes[i].start,
          end: indexes[i].end,
          rel_type: indexes[i].rel_type
        })

        if (i < indexes.length - 1 && indexes[i].end !== indexes[i + 1].start) {
          chunks.push({
            start: indexes[i].end,
            end: indexes[i + 1].start,
            rel_type: undefined
          })
        }
      }

      if (chunks.at(-1).end !== text.length) {
        chunks.push({
          start: indexes.at(-1).end,
          end: text.length,
          rel_type: undefined
        })
      }

      // console.log(chunks)

      for (let i = 0; i < chunks.length; i++) {
        var textNode
        if (chunks[i].rel_type === 'elaboratedBy') {
          textNode = $createHighlightDepNode(
            'highlight-dep-elb',
            text.slice(chunks[i].start, chunks[i].end)
          )
        } else {
          textNode = $createTextNode(text.slice(chunks[i].start, chunks[i].end))
        }
        paragraphNode.append(textNode)
      }
    }
  })
}

export function highlightCertainText () {}
