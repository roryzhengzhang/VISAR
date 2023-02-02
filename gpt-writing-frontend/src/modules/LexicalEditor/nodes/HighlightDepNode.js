import type {
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedTextNode,
  } from 'lexical';
  
  import {addClassNamesToElement} from '@lexical/utils';
  import {$applyNodeReplacement, TextNode} from 'lexical';
  
  /** @noInheritDoc */
  export class HighlightDepNode extends TextNode {
    static getType(): string {
      return 'hl-text';
    }
  
    static clone(node: HighlightDepNode): HighlightDepNode {
      return new HighlightDepNode(node.__text, node.__key);
    }
  
    constructor(text: string, hl_type, key?: NodeKey) {
      super(text, key);
      this.__hl_type = hl_type;
    }
  
    createDOM(config: EditorConfig): HTMLElement {
      const element = super.createDOM(config);
      addClassNamesToElement(element, this.__hl_type);
      return element;
    }
  
    static importJSON(serializedNode: SerializedTextNode): HighlightDepNode {
      const node = $createHighlightDepNode(serializedNode.text);
      node.setFormat(serializedNode.format);
      node.setDetail(serializedNode.detail);
      node.setMode(serializedNode.mode);
      node.setStyle(serializedNode.style);
      return node;
    }
  
    exportJSON(): SerializedTextNode {
      return {
        ...super.exportJSON(),
        type: 'hashtag',
      };
    }
  
    canInsertTextBefore(): boolean {
      return true;
    }
  
    isTextEntity(): true {
      return true;
    }
  }
  
  export function $createHighlightDepNode(hl_type, text = ''): HighlightDepNode {
    return $applyNodeReplacement(new HighlightDepNode(text, hl_type));
  }
  
  export function $isHighlightDepNode( node: LexicalNode | null | undefined) {
    return node instanceof HighlightDepNode;
  }