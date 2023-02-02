import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDependency, getDependencies } from "../neo4j";
import { positionFloatingButton, highlightDepText } from "../utils";
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
import { mergeRegister } from "@lexical/utils";
import {
    ELABORATE_COMMAND,
    ADD_EXAMPLE_COMMAND,
    SHOW_DEPENDENCY_COMMAND,
    lowPriority
} from "../commands/SelfDefinedCommands";
import { $createHighlightDepNode } from "../nodes/HighlightDepNode";

export function FloatingButton({ editor }) {
    const buttonRef = useRef(null);

    const showDependencies = useCallback(() => {
        const selection = $getSelection();

        const node = selection.getNodes()[0];

        getDependencies(node).then(res => {

            highlightDepText(editor, res);
            
        })

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

        if (buttonElem === null) {
            return;
        }

        const rootElement = editor.getRootElement();
        if (
            selection != null &&
            !nativeSelection.isCollapsed &&
            rootElement != null &&
            rootElement.contains(nativeSelection.anchorNode)
        ) {
            const domRange = nativeSelection.getRangeAt(0);
            let rect;
            if (nativeSelection.anchorNode === rootElement) {
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

    useEffect(() => {
        const buttonElem = buttonRef.current;

        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateFloatingButton();
                })
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
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
            ),
        );
    }, [editor, updateFloatingButton]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateFloatingButton();
        });
    }, [editor, updateFloatingButton]);

    return (
        <div ref={buttonRef} className="floatbuttongroup">
            <button className="float-item" onClick={() => { editor.dispatchCommand(ELABORATE_COMMAND, null) }}>
                Elaborate
            </button>
            <button className="float-item" onClick={() => { editor.dispatchCommand(ADD_EXAMPLE_COMMAND, null) }}>
                Add example
            </button>
            <button className="float-item" onClick={() => { editor.dispatchCommand(SHOW_DEPENDENCY_COMMAND, null) }}>
                Show dependency
            </button>
        </div>
    )
}