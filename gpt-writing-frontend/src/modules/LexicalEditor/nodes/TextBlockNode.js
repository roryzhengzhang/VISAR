import type {
    EditorConfig,
    GridSelection,
    LexicalNode,
    NodeKey,
    NodeSelection,
    RangeSelection,
    SerializedElementNode,
    Spread,
  } from 'lexical';
  
  import {
    addClassNamesToElement,
    removeClassNamesFromElement,
  } from '@lexical/utils';
  import {
    $applyNodeReplacement,
    $isElementNode,
    $isRangeSelection,
    ElementNode,
  } from 'lexical';
  
  export type SerializedTextBlockNode = Spread<
    {
      ids: Array<string>;
      type: 'textBlock';
      version: 1;
      key: string;
    },
    SerializedElementNode
  >;
  
  /** @noInheritDoc */
  export class TextBlockNode extends ElementNode {
    /** @internal */
    __ids: Array<string>;
    __element: HTMLElement;
  
    static getType(): string {
      return 'textBlock';
    }
  
    static clone(node: TextBlockNode): TextBlockNode {
      return new TextBlockNode(Array.from(node.__ids), node.__key);
    }
  
    // static importDOM(serializedNode) {
    //   const node = $createTextBlockNode(serializedNode.ids);
    //   return node
    // }
  
    static importJSON(serializedNode: SerializedTextBlockNode): TextBlockNode {
      const node = $createTextBlockNode(serializedNode.ids);
      node.setFormat(serializedNode.format);
      node.setIndent(serializedNode.indent);
      node.setDirection(serializedNode.direction);
      return node;
    }
  
    exportJSON(): SerializedTextBlockNode {
      return {
        ...super.exportJSON(),
        key: this.__key,
        ids: this.getIDs(),
        type: 'textBlock',
        version: 1,
      };
    }
  
    constructor(ids: Array<string>, key?: NodeKey) {
      super(key);
      this.__ids = ids || [];
    }
  
    createDOM(config: EditorConfig): HTMLElement {
      const element = document.createElement('text-block');
      this.__element = element;
      addClassNamesToElement(element, config.theme.textBlock);
    //   if (this.__ids.length > 1) {
    //     addClassNamesToElement(element, config.theme.markOverlap);
    //   }
      return element;
    }

    setDOM(addClassNames, removeClassNames) {
        addClassNamesToElement(this.__element, addClassNames);
        removeClassNamesFromElement(this.__element, removeClassNames);
    }
  
    updateDOM(
      prevNode: TextBlockNode,
      element: HTMLElement,
      config: EditorConfig,
    ): boolean {

      // console.log("TextBlockNode.updateDOM")
      const prevIDs = prevNode.__ids;
      const nextIDs = this.__ids;
      const prevIDsCount = prevIDs.length;
      const nextIDsCount = nextIDs.length;
      const overlapTheme = config.theme.markOverlap;
  
      if (prevIDsCount !== nextIDsCount) {
        if (prevIDsCount === 1) {
          if (nextIDsCount === 2) {
            addClassNamesToElement(element, overlapTheme);
          }
        } else if (nextIDsCount === 1) {
          removeClassNamesFromElement(element, overlapTheme);
        }
      }
      return false;
    }
  
    hasID(id: string): boolean {
      const ids = this.getIDs();
      for (let i = 0; i < ids.length; i++) {
        if (id === ids[i]) {
          return true;
        }
      }
      return false;
    }
  
    getIDs(): Array<string> {
      const self = this.getLatest();
      return $isTextBlockNode(self) ? self.__ids : [];
    }
  
    addID(id: string): void {
      const self = this.getWritable();
      if ($isTextBlockNode(self)) {
        const ids = self.__ids;
        self.__ids = ids;
        for (let i = 0; i < ids.length; i++) {
          // If we already have it, don't add again
          if (id === ids[i]) return;
        }
        ids.push(id);
      }
    }
  
    deleteID(id: string): void {
      const self = this.getWritable();
      if ($isTextBlockNode(self)) {
        const ids = self.__ids;
        self.__ids = ids;
        for (let i = 0; i < ids.length; i++) {
          if (id === ids[i]) {
            ids.splice(i, 1);
            return;
          }
        }
      }
    }
  
    insertNewAfter(
      selection: RangeSelection,
      restoreSelection = true,
    ): null | ElementNode {
      const element = this.getParentOrThrow().insertNewAfter(
        selection,
        restoreSelection,
      );
      if ($isElementNode(element)) {
        const TextBlockNode = $createTextBlockNode(this.__ids);
        element.append(TextBlockNode);
        return TextBlockNode;
      }
      return null;
    }
  
    canInsertTextBefore(): false {
      return false;
    }
  
    canInsertTextAfter(): false {
      return false;
    }
  
    canBeEmpty(): false {
      return false;
    }
  
    isInline(): true {
      return true;
    }
  
    extractWithChild(
      child: LexicalNode,
      selection: RangeSelection | NodeSelection | GridSelection,
      destination: 'clone' | 'html',
    ): boolean {
      if (!$isRangeSelection(selection) || destination === 'html') {
        return false;
      }
      const anchor = selection.anchor;
      const focus = selection.focus;
      const anchorNode = anchor.getNode();
      const focusNode = focus.getNode();
      const isBackward = selection.isBackward();
      const selectionLength = isBackward
        ? anchor.offset - focus.offset
        : focus.offset - anchor.offset;
      return (
        this.isParentOf(anchorNode) &&
        this.isParentOf(focusNode) &&
        this.getTextContent().length === selectionLength
      );
    }
  
    excludeFromCopy(destination: 'clone' | 'html'): boolean {
      return destination !== 'clone';
    }
  }
  
  export function $createTextBlockNode(ids: Array<string>): TextBlockNode {
    return $applyNodeReplacement(new TextBlockNode(ids));
  }
  
  export function $isTextBlockNode(node: LexicalNode | null): TextBlockNode {
    return node instanceof TextBlockNode;
  }