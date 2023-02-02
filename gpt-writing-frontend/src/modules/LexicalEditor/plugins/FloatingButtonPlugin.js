import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    createCommand
} from "lexical";
import { createPortal } from "react-dom";
import { FloatingButton } from "../widgets/FloatingButton";
 import ElaborateFLoatingGroup from "../widgets/ElaborateFloatGroup";

export default function FloatingButtonPlugin() {
    const [editor] = useLexicalComposerContext();
    const pluginRef = useRef(null);

    return (
        <div ref={pluginRef}>
            {
                createPortal(<FloatingButton editor={editor} />, document.body)

            }
            {
                createPortal(<ElaborateFLoatingGroup editor={editor} />, document.body)
            }
        </div>
    )
}