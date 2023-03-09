import {
  EditorConfig,
  ElementNode,
  LexicalNode,
  NodeKey,
  SerializedTextNode
} from 'lexical'

import { addClassNamesToElement } from '@lexical/utils'
import { $applyNodeReplacement, TextNode } from 'lexical'

/** @noInheritDoc */
export class HighlightDepNode extends TextNode {

  __element: HTMLElement;
  __prompt = "";

  static getType (): string {
    return 'hl-text'
  }

  static clone (node: HighlightDepNode): HighlightDepNode {
    return new HighlightDepNode(node.__text, node.__key)
  }

  constructor (text: string, hl_type, prompt, key?: NodeKey) {
    super(text, key)
    this.__hl_type = hl_type
    this.__prompt = prompt
  }

  getKey() {
    return this.__key
  }

  createDOM (config: EditorConfig): HTMLElement {
    const element = super.createDOM(config)
    this.__element = element
    addClassNamesToElement(element, this.__hl_type)
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

  static importJSON (serializedNode: SerializedTextNode): HighlightDepNode {
    const node = $createHighlightDepNode(serializedNode.text)
    node.setFormat(serializedNode.format)
    node.setDetail(serializedNode.detail)
    node.setMode(serializedNode.mode)
    node.setStyle(serializedNode.style)
    return node
  }

  exportJSON (): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: 'hl-type'
    }
  }

  canInsertTextBefore (): boolean {
    return true
  }

  canInsertTextAfter (): boolean {
    return false
  }

  isTextEntity (): true {
    return true
  }
}

export function $createHighlightDepNode (hl_type, text = '', prompt = ''): HighlightDepNode {
  return $applyNodeReplacement(new HighlightDepNode(text, hl_type, prompt))
}

export function $isHighlightDepNode (node: LexicalNode | null | undefined) {
  return node instanceof HighlightDepNode
}
