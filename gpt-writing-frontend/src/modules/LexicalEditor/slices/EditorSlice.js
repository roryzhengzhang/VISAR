import { createSlice, createAsyncThunk, current } from '@reduxjs/toolkit'

const initialState = {
    modalOpen: false,
    selectedKeywords: [],
    allKeywords: [],
    prompts: [],
    selectedPrompts: [],
    promptStatus: "empty",
}

const editorSlice = createSlice({
    name: "editor",
    initialState,
    reducers: {
        setModalOpen(state, action) {
            console.log("set Modal Open is called")
            return {
                ...state,
                modalOpen: true
            }
        },
        setModalClose(state, action) {
            return {
                ...state,
                modalOpen: false
            }
        },
        toggleElabPromptKeywords(state, action) {

            const del_dim = action.payload;

            let selectedKeywords = [...state.selectedKeywords];

            if (selectedKeywords.includes(del_dim)) {
                selectedKeywords = selectedKeywords.filter((c) => c !== del_dim);
            } else {
                selectedKeywords.push(del_dim);
            }

            return {
                ...state,
                selectedKeywords: selectedKeywords,
                // keep prompts that correponds to the selected keywords at this time
                prompts: state.prompts.filter((c) => selectedKeywords.includes(c["keyword"])),
                selectedPrompts: state.selectedPrompts.filter((c) => selectedKeywords.includes(c["keyword"]))
            }
        },
        setPromptKeywords(state, action) {

            console.log(action.payload)

            return {
                ...state,
                allKeywords: action.payload
            }
        },
        initPrompts(state, action) {
            return {
                ...state,
                selectedPrompts: [],
                prompts: [],
                promptStatus: "empty",
                allKeywords: [],
                selectedKeywords: []
            }
        },
        setPrompts(state, action) {
            return {
                ...state,
                prompts: action.payload
            }
        },
        setPromptStatus(state, action) {
            return {
                ...state,
                promptStatus: action.payload
            }
        },
        handleSelectedPromptsChanged(state, action) {
            const p = action.payload;
            const copy = [...state.selectedPrompts];

            const index = copy.findIndex(x => x["prompt"] === p["prompt"]);

            console.log(`index: ${index}`)
            console.log(`copy: ${copy}`)

            if (index > -1) 
            {
                console.log(`includes ${p}`)
                copy.splice(index, 1)
            }
            else 
            {
                copy.push(p);
            }

            return {
                ...state,
                selectedPrompts: copy
            }
        }
    }
})

export const { setModalOpen, setModalClose, setPromptStatus, setPrompts, initPrompts, toggleElabPromptKeywords, setPromptKeywords, initSelectedPrompts, handleSelectedPromptsChanged } = editorSlice.actions;

export default editorSlice.reducer;