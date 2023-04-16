import ExampleTheme from './themes/ExampleTheme'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { NodeEventPlugin } from '@lexical/react/LexicalNodeEventPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import TreeViewPlugin from './plugins/TreeViewPlugin'
import ToolbarPlugin from './plugins/ToolbarPlugin'
import EditablePlugin from './plugins/ToggleEditablePlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import {
  addClassNamesToElement,
  removeClassNamesFromElement
} from '@lexical/utils'
import { ListItemNode, ListNode } from '@lexical/list'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { TRANSFORMERS } from '@lexical/markdown'
import FloatingButtonPlugin from './plugins/FloatingButtonPlugin'
import ListMaxIndentLevelPlugin from './plugins/ListMaxIndentLevelPlugin'
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin'
import MuiAppBar from '@mui/material/AppBar'
import Drawer from '@mui/material/Drawer'
import AutoLinkPlugin from './plugins/AutoLinkPlugin'
import './styles.css'
import { styled, useTheme } from '@mui/material/styles'
import { $getSelection, ParagraphNode, TextNode, $getNodeByKey, RootNode, LineBreakNode } from 'lexical'
import LoadingPlugin from './plugins/LoadingPlugin'
import { HighlightDepNode } from './nodes/HighlightDepNode'
import ReactFlowModal from './widgets/ReactFlowModal'
import SaveModal from './widgets/SaveModal'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import { useLocation } from 'react-router-dom'
import ReactFlowPlugin from './plugins/ReactFLowPlugin'
import { TextBlockNode } from './nodes/TextBlockNode'
import { Typography } from '@mui/material'
import {
  setCurClickedNodeKey,
  setCurSelectedNodeKey,
  setIsCurNodeEditable,
  setStudyCondition,
  setUsername,
  setSessionId,
  setTaskDescription
} from './slices/EditorSlice'
import { setNodeSelected } from './slices/FlowSlice'
import SeeAlternativeModal from './widgets/SeeAlternativeModal'
import FixWeaknessModal from './widgets/FixWeaknessModal'
import { ADD_EXAMPLE_COMMAND } from './commands/SelfDefinedCommands'
import RefineModal from './widgets/RefineModal'
import ReactFlow, { useReactFlow, ReactFlowProvider } from 'reactflow'
import UpdateModal from './widgets/UpdateModal'
import { useEffect } from 'react'
import ManualAddNodeModal from './widgets/ManualAddNodeModal'
import TaskDescriptionPlugin from './plugins/TaskDescriptionPlugin'

function Placeholder () {
  return <div className='editor-placeholder'>Enter some rich text...</div>
}

const drawerWidth = '50%'

const Main = styled('main', { shouldForwardProp: prop => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    // padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    marginTop: '46px',
    // marginRight: -drawerWidth,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen
      }),
      marginRight: drawerWidth
    })
  })
)

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: prop => prop !== 'open'
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  height: '46px',
  backgroundColor: '#fff',
  ...(open && {
    width: `calc(100% - ${drawerWidth})`,
    marginRight: `${drawerWidth}`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    })
  })
}))

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-start'
}))

const editorConfig = {
  // The editor theme
  theme: ExampleTheme,
  // Handling of errors during update
  onError (error) {
    throw error
  },
  // Any custom nodes go here
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    HighlightDepNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
    TextBlockNode
  ]
}

export default function Editor () {
  const dispatch = useDispatch()
  const location = useLocation()
  const mindmapOpen = useSelector(state => state.editor.mindmapOpen)
  const curSelectedNodeKey = useSelector(
    state => state.editor.curSelectedNodeKey
  )
  const isCurNodeEditable = useSelector(state => state.editor.isCurNodeEditable)
  const condition = useSelector(state => state.editor.condition)

  useEffect(() => {
    console.log('set condition', location.state.condition)
    if (
      location.state.condition !== null &&
      location.state.condition !== undefined
    ) {
      dispatch(setStudyCondition(location.state.condition))
      dispatch(setUsername(location.state.username))
      dispatch(setSessionId(location.state.sessionId))
      dispatch(setTaskDescription(location.state.taskDescription))
    }
  }, [location])

  return (
    <Box>
      <LexicalComposer initialConfig={editorConfig}>
        <AppBar position='fixed' open={mindmapOpen}>
          <ToolbarPlugin />
        </AppBar>
        <Main open={mindmapOpen}>
          <div className='editor-container'>
            <FloatingButtonPlugin />
            <LoadingPlugin />
            <div className='editor-inner'>
              <RichTextPlugin
                contentEditable={<ContentEditable className='editor-input' style={{height: "988px"}} />}
                placeholder={<Placeholder />}
              />
              <HistoryPlugin />
              {/* <TaskDescriptionPlugin /> */}
              {/* <TreeViewPlugin /> */}
              {/* <ReactFlowPlugin /> */}
              <AutoFocusPlugin />
              <CodeHighlightPlugin />
              <ListPlugin />
              <EditablePlugin />
              <LinkPlugin />
              <AutoLinkPlugin />
              <NodeEventPlugin 
                nodeType={LineBreakNode}
                eventType={'click'}
                eventListener={(e, editor, key) => {
                  console.log('line break clicked')
                  editor.setEditable(true)
                  const selection = $getSelection()
                  const child = selection.getNodes()[0]
                  dispatch(setCurClickedNodeKey(child.__key))
                }}
              />
              <NodeEventPlugin
                nodeType={TextNode}
                eventType={'click'}
                eventListener={(e, editor, key) => {
                  editor.update(() => {
                    const selection = $getSelection()
                    const child = selection.getNodes()[0]
                    console.log('text node clicked', child.__key)
                    // curClickedNodeKey is used to navigate the focus of the react flow to the corresponding node
                    dispatch(setCurClickedNodeKey(child.__key))
                    // dispatch(setCurClickedNodeKey(''))
                    editor.setEditable(true)
                    editor.focus()
                  })
                  e.stopPropagation()
                }}
              />
              <NodeEventPlugin
                nodeType={TextBlockNode}
                eventType={'click'}
                eventListener={(e, editor, key) => {
                  // console.log('flow viewport', flowInstance.getViewport())

                  editor.update(() => {

                    if ($getNodeByKey(key) === null || $getNodeByKey(key) === undefined) {
                      console.log()
                      return
                    }

                    const selection = $getSelection()
                    const child = selection.getNodes()[0]
                    dispatch(setCurClickedNodeKey(child.__key))
                    // console.log("[event listener] curSelectedNodeKey, node key, isCurNodeEditable: ", curSelectedNodeKey, child.__key, isCurNodeEditable)
                    if (
                      child.__key === curSelectedNodeKey &&
                      isCurNodeEditable
                    ) {
                      // console.log("This is the the node selected in last time")
                      editor.setEditable(true)
                      editor.focus()
                    } else {
                      // restore the default background transprancy for the last selected node
                      if (curSelectedNodeKey !== child.__key) {
                        // dispatch(setCurSelectedNodeKey(child.__key))
                        dispatch(setNodeSelected(child.__key))
                        const lastSelectedNode =
                          $getNodeByKey(curSelectedNodeKey)
                        if (
                          lastSelectedNode !== null &&
                          lastSelectedNode !== undefined
                        ) {
                          lastSelectedNode.setStyle(
                            'background-color: #f9c74f;'
                          )
                        }
                      }
                      console.log('gonna disable editable')
                      editor.setEditable(false)
                      dispatch(setIsCurNodeEditable(false))
                    }
                  })
                }}
              />
              <ListMaxIndentLevelPlugin maxDepth={7} />
              <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            </div>
          </div>
        </Main>
        {condition && (
          <Drawer
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth
              }
            }}
            variant='persistent'
            anchor='right'
            open={mindmapOpen}
          >
            <Typography>Very good!</Typography>
            <ReactFlowPlugin />
          </Drawer>
        )}
        <ReactFlowModal />
        <SeeAlternativeModal />
        <RefineModal />
        <FixWeaknessModal />
        <UpdateModal />
        <ManualAddNodeModal />
        <SaveModal />
      </LexicalComposer>
    </Box>
  )
}
