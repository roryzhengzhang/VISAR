import {
  EditorConfig,
  ElementNode,
  LexicalNode,
  NodeKey,
  SerializedTextNode
} from 'lexical'

import { addClassNamesToElement } from '@lexical/utils'
import { $applyNodeReplacement, TextNode } from 'lexical'

let total = 0

/** @noInheritDoc */
export class HighlightDepNode extends TextNode {

  __element: HTMLElement;
  __prompt = "";

  static getType (): string {
    return 'hl-text'
  }

  static clone (node: HighlightDepNode): HighlightDepNode {
    return new HighlightDepNode(node.__text, node.__hl_type, node.__key) // the code is changed herec
  }

  constructor (text: string, hl_type, key?: NodeKey) {
    super(text, key)
    this.__hl_type = hl_type
    // this.__prompt = prompt
  }

  getKey() {
    return this.__key
  }

  createDOM (config: EditorConfig): HTMLElement { // config: Provides access to the editor’s configuration and utilities
    const element = super.createDOM(config)
    // this.__element = element
    addClassNamesToElement(element, this.__hl_type) // add to it so that CSS style can be applied on it
    return element
  }

  setPrompt (prompt: string) {
    this.__prompt = prompt
  }

  getPrompt (): string {
    const self = this.getLatest();
    console.log("prompt: " + self.__prompt)
    return self.__prompt
  }

  updateDOM(
    prevNode,
    element,
    config,
    
  ): boolean {
    super.updateDOM(prevNode, element, config)
    this.__element = prevNode.__element
    this.__hl_type = prevNode.__hl_type
    this.__prompt = prevNode.__prompt
    return false;
  }

  // serializedNode : contains all the necessary data to recreate the node. 
  // It includes properties such as the text content, formatting details, and other attributes of the node.
  static importJSON (serializedNode: SerializedTextNode): HighlightDepNode {
    const node = $createHighlightDepNode('highlight-dep-elb', serializedNode.text, serializedNode.key)
    node.setFormat(serializedNode.format)
    node.setDetail(serializedNode.detail)
    node.setMode(serializedNode.mode)
    node.setStyle(serializedNode.style)
    return node
  }

  exportJSON (): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: 'hl-text',
      version: 1,
    }
  }

  canInsertTextBefore (): boolean {
    return true
  }

  canInsertTextAfter (): boolean {
    return true
  }

  isTextEntity (): true {
    return true
  }
}

export function $createHighlightDepNode (hl_type, text = '', key = ''): HighlightDepNode {
  if (key !== '') {
    return new $applyNodeReplacement(HighlightDepNode(text, hl_type, key))
    // $applyNodeReplacement is used to properly handle the replacement of the node within the editor’s state, 
    // ensuring all necessary updates and state integrations are performed.
  } else {
    // total += 1
    // const key = total.toString()
    // console.log("[highlight dep node] key is ", key)
    return $applyNodeReplacement(new HighlightDepNode(text, hl_type))
  }
  
}

export function $isHighlightDepNode (node: LexicalNode | null | undefined) {
  return node instanceof HighlightDepNode
}
