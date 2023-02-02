import { configureStore } from '@reduxjs/toolkit'
import EditorReducer from '../modules/LexicalEditor/slices/EditorSlice'
import FlowReducer from '../modules/LexicalEditor/slices/FlowSlice'

export default configureStore({
    reducer: {
        editor: EditorReducer,
        flow: FlowReducer
    }
})
