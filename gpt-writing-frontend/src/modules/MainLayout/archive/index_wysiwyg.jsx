import { useEffect, useState, useRef } from 'react';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { EditorState, Modifier, SelectionState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';
import { OrderedSet } from 'immutable';

import createInlineToolbarPlugin, {
    Separator,
} from '@draft-js-plugins/inline-toolbar';
import {
    ItalicButton,
    BoldButton,
    UnderlineButton,
    CodeButton,
    HeadlineOneButton,
    HeadlineTwoButton,
    HeadlineThreeButton,
    UnorderedListButton,
    OrderedListButton,
    BlockquoteButton,
    CodeBlockButton,
} from '@draft-js-plugins/buttons';



function MainLayout() {

    const [editorState, setEditorState] = useState(EditorState.createEmpty())

    function onEditorStateChange(editorState) {
        setEditorState(editorState)
    }

    function InferenceButton(props) {

        const { editorState, onChange } = props;

        function makeInference() {
            console.log("Star is clicked")

            const selectionState = editorState.getSelection();
            const anchorKey = selectionState.getAnchorKey();
            const currentContent = editorState.getCurrentContent()
            const currentContentBlock = currentContent.getBlockForKey(anchorKey);
            const start = selectionState.getStartOffset();
            const end = selectionState.getEndOffset();
            const selectedText = currentContentBlock.getText().slice(start, end);

            console.log(`selected text: ${selectedText}`)

            const fetchPromise = fetch("http://35.188.99.37:8088/?" + new URLSearchParams({
                prompt: selectedText
            }), {
                mode: "cors"
            })

            fetchPromise.then(res => {
                return res.json()
            }).then(res => {
                const text = res['response'].trim()

                console.log(`gpt response: ${text}`)

                var newContentState;
                if (selectionState.isCollapsed()) {
                    console.log(`selectState: ${selectionState}`)
                    const nextContentState = Modifier.insertText(currentContent, selectionState, text);
                    newContentState = EditorState.push(
                        editorState,
                        nextContentState,
                        'insert-characters'
                    );

                    setEditorState(newContentState)
                } else {
                    // We need to make anchor and focus equal in order to insert text after the spanned selection

                    const anchorOffset = selectionState.getAnchorOffset()
                    const focusOffset = selectionState.getFocusOffset()
                    console.log(`anchorOffset: ${anchorOffset}, focusOffset: ${focusOffset}`)
                    console.log(`selectionState: ${selectionState}`)

                    let selection = new SelectionState({
                        anchorKey: selectionState.getAnchorKey(), // key of block
                        anchorOffset: Math.max(anchorOffset, focusOffset),
                        focusKey: selectionState.getAnchorKey(),
                        focusOffset: Math.max(anchorOffset, focusOffset), // key of block
                        hasFocus: true,
                        isBackward: false // isBackward = (focusOffset < anchorOffset)
                    });

                    const newEditorState = EditorState.forceSelection(editorState, selection);
                    const nextContentState = Modifier.insertText(currentContent, selection, "\n" + text, OrderedSet.of('HIGHLIGHT'));
                    const newContentState = EditorState.push(
                        newEditorState,
                        nextContentState,
                        'insert-characters'
                    );

                    setEditorState(newContentState)
                }


            }).catch(function (error) {
                console.log(`Error happend: ${error}`)
                const anchorOffset = selectionState.getAnchorOffset()
                const focusOffset = selectionState.getFocusOffset()
                var collapsedSelectState;
                if (anchorOffset > focusOffset) {
                    collapsedSelectState = selectionState.set('focusOffset', anchorOffset)
                } else {
                    collapsedSelectState = selectionState.set('anchorOffset', focusOffset)
                }
                const nextContentState = Modifier.insertText(currentContent, collapsedSelectState, "\n there is a server error happened", OrderedSet.of('HIGHLIGHT'));
                const newContentState = EditorState.push(
                    editorState,
                    nextContentState,
                    'insert-characters'
                );
                setEditorState(newContentState)
            })
        }

        return (
            <div onClick={makeInference}>🌟</div>
        )
    }

    const styleMap = {
        'HIGHLIGHT': {
            'backgroundColor': '#faed27',
        }
    };

    const inlineToolbarPlugin = createInlineToolbarPlugin();
    const { InlineToolbar } = inlineToolbarPlugin;
    const plugins = [inlineToolbarPlugin];

    return (
        <div>
            <Editor
                customStyleMap={styleMap}
                wrapperClassName="wrapper-class"
                editorClassName="editor-class"
                // toolbarClassName="toolbar-class"
                editorState={editorState}
                onEditorStateChange={onEditorStateChange}
                plugins={plugins}
                toolbarCustomButtons={[<InferenceButton />]}
            />
            <InlineToolbar>
                {
                    // may be use React.Fragment instead of div to improve perfomance after React 16
                    (externalProps) => (
                        <div>
                            <BoldButton {...externalProps} />
                            <ItalicButton {...externalProps} />
                            <UnderlineButton {...externalProps} />
                            <CodeButton {...externalProps} />
                            <Separator {...externalProps} />
                            <UnorderedListButton {...externalProps} />
                            <OrderedListButton {...externalProps} />
                            <BlockquoteButton {...externalProps} />
                            <CodeBlockButton {...externalProps} />
                        </div>
                    )
                }
            </InlineToolbar>
            {/* </Box> */}
        </div>

    )
}


export default {
    routeProps: {
        path: "/workspace",
        element: <MainLayout />
    },
    name: 'MainLayout'
};
