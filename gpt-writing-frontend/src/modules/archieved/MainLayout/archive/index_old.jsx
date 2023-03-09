// import { useEffect, useState, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import MUIRichTextEditor from 'mui-rte';
// import InvertColorsIcon from '@mui/icons-material/InvertColors'
// import TableChartIcon from '@mui/icons-material/TableChart'
// import AppBar from '@mui/material/AppBar';
// import Box from '@mui/material/Box';
// import Toolbar from '@mui/material/Toolbar';
// import Typography from '@mui/material/Typography';
// import Button from '@mui/material/Button';
// import WebAssetIcon from '@mui/icons-material/WebAsset';
// import IconButton from '@mui/material/IconButton';
// import MenuIcon from '@mui/icons-material/Menu';
// import DoneIcon from '@mui/icons-material/Done'
// import { EditorState, Modifier } from 'draft-js'


// function MainLayout() {

//     const editorRef = useRef(null)

//     const MyBlock = (props) => {
//         return (
//             <div style={{
//                 padding: 10,
//                 backgroundColor: "#ebebeb"
//             }}>
//                 My Block content is:
//                 {props.children}
//             </div>
//         )
//     }

//     async function makeInference(prompt, _editorState, contentState, selectionState) {
//         const fetchPromise = fetch("http://35.188.99.37:8088/?" + new URLSearchParams({
//             prompt: prompt
//         }), {
//             mode: "cors"
//         })

//         fetchPromise.then(res => {
//             return res.json()
//         }).then(res => {
//             console.log(res)
//             const nextContentState = Modifier.insertText(contentState, selectionState, res['response'])
//             let nextEditorState = EditorState.push(
//                 _editorState,
//                 nextContentState,
//                 'insert-characters'
//             )
//             return nextEditorState
//         })

//         // fetchPromise.then(res => {
//         //     console.log(`response: ${JSON.stringify(res)}`)
//         //     return res
//         // })
//     }

//     // const handleGPT3Request = (prompt, contentState, selectionState) => {

//     //     console.log(`prompt [sendGPT3RequestToBackend]: ${prompt}`)

//     //     // const fetchPromise = fetch("http://35.188.99.37:8000/" + new URLSearchParams({
//     //     //     prompt: prompt
//     //     // }))

//     //     // fetchPromise.then(res => {
//     //     //     return res.json()
//     //     // }).then(completion => {
//     //     //     console.log(completion)
//     //     // })

//     //     return new Promise(async (resolve, reject) => {
//     //         const completion = await makeInference(prompt)

//     //         if(!completion) {
//     //             reject()
//     //             return
//     //         }

//     //         resolve({
//     //             data: {
//     //                 completion: completion
//     //             }
//     //         })
//     //     })
//     // }



//     // const handleGPT3Request = (prompt, contentState, selectionState) => {

//     //     // const { prompt } = props;

//     //     // editorRef.current.insertAtomicBlockAsync("Text", sendGPT3RequestToBackend(prompt), "GPT-3 is making inference")


//     // }

//     return (
//         <div>
//             <Box sx={{ flexGrow: 1 }}>
//                 <AppBar position="static">
//                     <Toolbar>
//                         <IconButton
//                             size="large"
//                             edge="start"
//                             color="inherit"
//                             aria-label="menu"
//                             sx={{ mr: 2 }}
//                         >
//                             <MenuIcon />
//                         </IconButton>
//                         <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
//                             Human-AI collaborative writing system
//                         </Typography>
//                         <Button color="inherit">Login</Button>
//                     </Toolbar>
//                 </AppBar>
//             </Box>
//             <Box>
//                 <MUIRichTextEditor 
//                     controls={["my-style", "highlight", "bold", "my-block", "empty", "add-card"]}
//                     label="Text Editor"
//                     inlineToolbar={false}
//                     ref={editorRef}
//                     customControls={[
//                         {
//                             name: "my-style",
//                             icon: <InvertColorsIcon />,
//                             type: "inline",
//                             inlineStyle: {
//                                 backgroundColor: "black",
//                                 color: "white"
//                             }
//                         },
//                         {
//                             name: "my-block",
//                             icon: <TableChartIcon />,
//                             type: "block",
//                             blockWrapper: <MyBlock />
//                         },
//                         {
//                             name: "empty",
//                             icon: <DoneIcon />,
//                             type: "callback",
//                             onClick: (editorState, name, anchor) => {
//                                 console.log(`Clicked ${name} control`)
//                                 return EditorState.createEmpty()
//                             }
//                         },
//                         {
//                             name: "add-card",
//                             icon: <WebAssetIcon />,
//                             type: "callback",
//                             onClick: (_editorState, _name, anchor) => {
//                                 var selectionState = _editorState.getSelection()
//                                 var anchorKey = selectionState.getAnchorKey();
//                                 var currentContent = _editorState.getCurrentContent()
//                                 var currentContentBlock = currentContent.getBlockForKey(anchorKey);
//                                 var start = selectionState.getStartOffset()
//                                 var end = selectionState.getEndOffset()
//                                 var selectedText = currentContentBlock.getText().slice(start, end);

//                                 console.log(`The selected text is: ${selectedText}`)
                                
//                                 const nextEditorState = makeInference(selectedText, _editorState, currentContent, selectionState)
//                                 return nextEditorState
//                             }
//                         }
//                     ]}
//                     />
//             </Box>

//         </div>
//     )
// }

// export default {
//     routeProps: {
//         path: "/workspace",
//         element: <MainLayout />
//     },
//     name: 'MainLayout'
// };