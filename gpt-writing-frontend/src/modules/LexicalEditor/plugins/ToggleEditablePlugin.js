import { registerCodeHighlighting } from '@lexical/code'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { $getSelection } from 'lexical'
import { $isHighlightDepNode } from '../nodes/HighlightDepNode'
import { TextBlockNode } from '../nodes/TextBlockNode'

export default function ToggleEditablePlugin () {
  const [editor] = useLexicalComposerContext()
  const dispatch = useDispatch()
  const curSelectedNodeKey = useSelector(
    state => state.editor.curSelectedNodeKey
  )

  // editor.registerNodeTransform(TextBlockNode, tbNode => {
  //   // if( tbNode.__key == curSelectedNodeKey ) {
  //   //   edtior.setEditable(true)
  //   // } else {
  //   //   editor.setEditable(false)
  //   // }
  // })

  return null
}
