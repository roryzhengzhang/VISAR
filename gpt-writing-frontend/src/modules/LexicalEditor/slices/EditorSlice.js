import { createSlice, createAsyncThunk, current } from '@reduxjs/toolkit'

const initialState = {
  flowModalOpen: false,
  alternativeModalOpen: false,
  refineModalOpen: false,
  fixWeaknessModalOpen: false,
  mindmapOpen: false,
  selectedKeywords: [],
  allKeywords: [],
  prompts: [],
  counterArguments: [],
  selectedCounterArguments: [],
  selectedPrompts: [],
  curSelectedNodeKey: "",
  curClickedNodeKey: "",
  curSelection: "",
  promptStatus: 'empty',
  type: "elaborate",
  selectedSent: "",
  curRangeNodeKey: "",
  alterantives: [],
  selectedWeaknesses: [],
  selectedSupportingArguments: [],
  weaknesses: [],
  isCurNodeEditable: false,
  supportingArguments: [],
  condition: null,
  updateModalOpen: false,
  addNodeModalOpen: false,
  saveModalOpen: false,
  username: "",
  sessionId: "",
  isReactFlowInModal: false,
  isRangeMode: false,
  taskDescription: null
}

export const generateRewrite = createAsyncThunk(
  "editor/generateRewrite",
  async (args, { getState }) => {
    // const state = getState();
    console.log("[generateRewrite] args:", args)
    // const { basePrompt, mode, furInstruction, curSent } = args;
    const res = await fetch("https://visar.app/api/rewrite", {
      method: "POST",
      mode: "cors",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(args),
    }).then((res) => res.json());

    return { res: res };
  }
);

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setFlowModalOpen (state, action) {
      // console.log('set Modal Open is called')
      return {
        ...state,
        flowModalOpen: true
      }
    },
    setSelectedSent (state, action) {
      return {
        ...state,
        selectedSent: action.payload
      }
    },
    setRangeGenerationMode (state, action) {
      return {
        ...state,
        isRangeMode: action.payload
      }
    },
    setSessionId (state, action) {
      return {
        ...state,
        sessionId: action.payload
      }
    },
    setUsername (state, action) {
      return {
        ...state,
        username: action.payload
      }
    },
    setIsReactFlowInModal (state, action) {
      return {
        ...state,
        isReactFlowInModal: true
      }
    },
    setType (state, action) {
      return {
        ...state,
        type: action.payload
      }
    },
    setTaskDescription(state, action) {
      return {
        ...state,
        taskDescription: action.payload
      }
    },
    setIsCurNodeEditable (state, action) {
      return {
        ...state,
        isCurNodeEditable: action.payload
      }
    },
    setCurRangeNodeKey (state, action) {
      return {
        ...state,
        curRangeNodeKey: action.payload
      }
    },
    setCurClickedNodeKey (state, action) {
      return {
        ...state,
        curClickedNodeKey: action.payload
      }
    },
    setFlowModalClose (state, action) {
      return {
        ...state,
        flowModalOpen: false,
        isReactFlowInModal: false
      }
    },
    setAlternativeModalOpen (state, action) {
      return {
        ...state,
        alternativeModalOpen: true
      }
    },
    setUpdateModalOpen (state, action) {
      return {
        ...state,
        updateModalOpen: true
      }
    },
    setAddNodeModalOpen (state, action) {
      return {
        ...state,
        addNodeModalOpen: true
      }
    },
    setSaveModalOpen (state, action) {
      return {
        ...state,
        saveModalOpen: true
      }
    },
    setSaveModalClose (state, action) {
      return {
        ...state,
        saveModalOpen: false
      }
    },
    setAddNodeModalClose (state, action) {
      return {
        ...state,
        addNodeModalOpen: false
      }
    },
    setUpdateModalClose (state, action) {
      return {
        ...state,
        updateModalOpen: false
      }
    },
    setAlternativeModalClose (state, action) {
      return {
        ...state,
        alternativeModalOpen: false
      }
    },
    setRefineModalOpen (state, action) {
      return {
        ...state,
        refineModalOpen: true
      }
    },
    setFixWeaknessModalOpen (state, action) {
      return {
        ...state,
        fixWeaknessModalOpen: true
      }
    },
    setFixWeaknessModalClose (state, action) {
      return {
        ...state,
        fixWeaknessModalOpen: false
      }
    },
    setRefineModalClose (state, action) {
      return {
        ...state,
        refineModalOpen: false
      }
    },
    setCurSelectedNodeKey (state, action) {
      return {
        ...state,
        curSelectedNodeKey: action.payload
      }
    },
    setMindmapOpen (state, action) {
      return {
        ...state,
        mindmapOpen: true
      }
    },
    setMindmapClose (state, action) {
      // console.log('set Modal Open is called')
      return {
        ...state,
        mindmapOpen: false
      }
    },
    toggleElabPromptKeywords (state, action) {
      const del_dim = action.payload

      let selectedKeywords = [...state.selectedKeywords]

      if (selectedKeywords.includes(del_dim)) {
        selectedKeywords = selectedKeywords.filter(c => c !== del_dim)
      } else {
        selectedKeywords.push(del_dim)
      }

      return {
        ...state,
        selectedKeywords: selectedKeywords,
        // keep prompts that correponds to the selected keywords at this time
        // visiblePrompts: state.prompts.filter(c =>
        //   selectedKeywords.includes(c['keyword'])
        // ),
        selectedPrompts: state.selectedPrompts.filter(c =>
          selectedKeywords.includes(c['keyword'])
        )
      }
    },
    toggleWeakness (state, action) {
      const del_dim = action.payload

      let selectedWeaknesses = [...state.selectedWeaknesses]

      if (selectedWeaknesses.includes(del_dim)) {
        selectedWeaknesses = selectedWeaknesses.filter(c => c !== del_dim)
      } else {
        selectedWeaknesses.push(del_dim)
      }

      return {
        ...state,
        selectedWeaknesses: selectedWeaknesses,
      }
    },
    setCurSelection(state, action) {
      return {
        ...state,
        curSelection: action.payload
      }
    },
    setPromptKeywords (state, action) {
      // console.log(action.payload)

      return {
        ...state,
        allKeywords: action.payload
      }
    },
    setWeaknesses (state, action) {
      return {
        ...state,
        weaknesses: action.payload
      }
    },
    initPrompts (state, action) {
      return {
        ...state,
        selectedPrompts: [],
        prompts: [],
        promptStatus: 'empty',
        allKeywords: [],
        selectedKeywords: []
      }
    },
    setStudyCondition (state, action) {
      const cond = action.payload
      return {
        ...state,
        condition: cond
      }
    },
    setPrompts (state, action) {
      return {
        ...state,
        prompts: action.payload
      }
    },
    setCounterArguments (state, action) {
      return {
        ...state,
        counterArguments: action.payload
      }
    },
    resetSupportingArguments (state, action) {
      return {
        ...state,
        supportingArguments: [],
        selectedSupportingArguments: []
      }
    },
    resetCounterArguments (state, action) {
      return {
        ...state,
        counterArguments: [],
        selectedCounterArguments: []
      }
    },
    resetWeaknesses (state, action) {
      return {
        ...state,
        weaknesses: [],
        selectedWeaknesses: []
      }
    },
    resetPrompts (state, action) {
      return {
        ...state,
        prompts: [],
        selectedPrompts: [],
      }
    },
    setSupportingArguments (state, action) {
      return {
        ...state,
        supportingArguments: action.payload
      }
    },
    setPromptStatus (state, action) {
      return {
        ...state,
        promptStatus: action.payload
      }
    },
    handleSelectedPromptsChanged (state, action) {
      const p = action.payload
      const copy = [...state.selectedPrompts]

      const index = copy.findIndex(x => x['prompt'] === p['prompt'])
      if (index > -1) {
        copy.splice(index, 1)
      } else {
        copy.push(p)
      }

      return {
        ...state,
        selectedPrompts: copy
      }
    },
    handleSelectedWeaknessChanged (state, action) {
      const p = action.payload
      const copy = [...state.selectedWeaknesses]

      console.log("payload: ", p)
      console.log("selected: ", copy)

      const index = copy.findIndex(x => x === p)
      if (index > -1) {
        copy.splice(index, 1)
      } else {
        copy.push(p)
      }

      return {
        ...state,
        selectedWeaknesses: copy
      }
    },
    handleSelectedCAChanged (state, action) {
      const p = action.payload
      const copy = [...state.selectedCounterArguments]

      const index = copy.findIndex(x => x === p)
      if (index > -1) {
        copy.splice(index, 1)
      } else {
        copy.push(p)
      }

      return {
        ...state,
        selectedCounterArguments: copy
      }
    },
    handleSelectedSAChanged (state, action) {
      const p = action.payload
      const copy = [...state.selectedSupportingArguments]

      const index = copy.findIndex(x => x === p)
      if (index > -1) {
        copy.splice(index, 1)
      } else {
        copy.push(p)
      }

      return {
        ...state,
        selectedSupportingArguments: copy
      }
    } 
  },
  extraReducers: {
    [generateRewrite.fulfilled]: (state, action) => {
      const { res } = action.payload
      return {
        ...state,
        alterantives: res["candidates"]
      }
    }
  }
})

export const {
  setMindmapOpen,
  setMindmapClose,
  setFlowModalOpen,
  setFlowModalClose,
  setType,
  setPromptStatus,
  handleSelectedCAChanged,
  setWeaknessTypes,
  setPrompts,
  initPrompts,
  setCurSelectedNodeKey,
  toggleElabPromptKeywords,
  setPromptKeywords,
  setSelectedSent,
  initSelectedPrompts,
  handleSelectedPromptsChanged,
  setAlternativeModalOpen,
  setAlternativeModalClose,
  setCurRangeNodeKey,
  setRefineModalOpen,
  setRefineModalClose,
  setCurSelection,
  toggleWeakness,
  setCounterArguments,
  setWeaknesses,
  setFixWeaknessModalOpen,
  setFixWeaknessModalClose,
  handleSelectedWeaknessChanged,
  setSupportingArguments,
  handleSelectedSAChanged,
  setIsCurNodeEditable,
  setCurClickedNodeKey,
  resetPrompts, 
  resetWeaknesses,
  resetCounterArguments,
  resetSupportingArguments,
  setStudyCondition,
  setUpdateModalOpen,
  setUpdateModalClose,
  setAddNodeModalOpen,
  setAddNodeModalClose,
  setSessionId,
  setUsername,
  setSaveModalOpen,
  setSaveModalClose,
  setIsReactFlowInModal,
  setRangeGenerationMode,
  setTaskDescription
} = editorSlice.actions

export default editorSlice.reducer
