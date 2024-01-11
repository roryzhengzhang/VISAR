import {
  useCallback,
  useEffect,
  forwardRef,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $isRangeSelection,
  $getNodeByKey,
  $isParagraphNode,
  $createTextNode,
} from "lexical";
import {
  ELABORATE_COMMAND,
  EVIDENCE_COMMAND,
  lowPriority,
  highPriority,
} from "../commands/SelfDefinedCommands";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Skeleton from "@mui/material/Skeleton";
import CircularProgress from "@mui/material/CircularProgress";
import Select from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import {
  Button,
  Grid,
  MenuItem,
  Pagination,
  Tabs,
  Tab,
  Tooltip,
  Typography,
} from "@mui/material";
import { addDependency, getDependencies } from "../neo4j";
import { positionFloatingButton } from "../utils";
import { SHOW_LOADING_COMMAND } from "../commands/SelfDefinedCommands";
import { Container } from "@mui/system";
import { useSelector, useDispatch } from "react-redux";
import {
  setFlowModalOpen,
  toggleElabPromptKeywords,
  setPromptKeywords,
  handleSelectedPromptsChanged,
  initPrompts,
  setPrompts,
  setPromptStatus,
  setCurRangeNodeKey,
  setType,
  setCurSelectedNodeKey,
  setIsReactFlowInModal,
  setRangeGenerationMode,
} from "../slices/EditorSlice";
import { loadNodes, setNodeSelected } from "../slices/FlowSlice";

const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function ElaborateFLoatingGroup({ editor }) {
  const buttonRef = useRef(null);
  const selectedPrompts = useSelector((state) => state.editor.selectedPrompts);
  const curRangeNodeKey = useSelector((state) => state.editor.curRangeNodeKey);
  const selectedKeywords = useSelector(
    (state) => state.editor.selectedKeywords
  );
  const allKeywords = useSelector(
    (state) => state.editor.allKeywords
  );
  const promptStatus = useSelector((state) => state.editor.promptStatus);
  const prompts = useSelector((state) => state.editor.prompts);
  const [isElaborate, setElaborate] = useState(false);
  const [isFetchingKeyword, setFetchingKeyword] = useState(false);
  const [promptedText, setPromptedText] = useState("");
  const [fetchingAlertOpen, setFetchingAlertOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const itemPerPage = 5;
  const type = useSelector((state) => state.editor.type);
  const [page, setPage] = useState(1);

  const dispatch = useDispatch();

  const handleChange = (event) => {
    setPromptedText(event.target.value);
  };

  // useCallback memorizes the state and will update when one of the dependency get updated
  const updateFloatingGroup = useCallback(() => {
    const selection = $getSelection();
    const buttonElem = buttonRef.current;
    const nativeSelection = window.getSelection();

    if (buttonElem === null) {
      return;
    }

    let condition;
    const rootElement = editor.getRootElement();

    if (type === "elaborate") {
      condition = selection != null &&
      !nativeSelection.isCollapsed &&
      rootElement != null &&
      rootElement.contains(nativeSelection.anchorNode) &&
      isElaborate;
    } else if (type === "evidence") {
      condition = selection != null &&
      rootElement != null &&
      rootElement.contains(nativeSelection.anchorNode) &&
      isElaborate;
    }

    if (condition) {
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
      // console.log(`[updateFloatingGroup]: element is inactive, isElaborate: ${isElaborate}`)
      positionFloatingButton(buttonElem, null);
    }

    return true;
  }, [editor, isElaborate]);

  // fetch the strategic Keywordensions for elaborating the selected text
  const fetchKeyword = () => {
    const selection = $getSelection();
    const selected_text = selection.getTextContent();
    const nodes = selection.getNodes();
    const node = nodes[0];
    // console.log("Nodes:")
    // console.log(nodes)
    setPromptedText(selected_text);
    
    const fetchPromise = fetch('https://visar.app/api/keyword', {
      method: 'POST',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        prompt: selected_text,
      })
    })

    fetchPromise
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        let Keywords = res["response"];
        dispatch(setPromptKeywords(Keywords));
        setFetchingKeyword(false);
      });
  };

  const fetchDiscussionPoints = () => {
    dispatch(setPromptStatus("fetching"));
    setFetchingAlertOpen(true);

    // IP: https://visar.app:8088
    fetch("https://visar.app/api/prompts", {
      method: "POST",
      mode: "cors",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        keywords: selectedKeywords,
        context: promptedText,
      }),
    })
      .then((response) => response.json())
      .then((response) => {
        dispatch(setPrompts(response["response"]));
        dispatch(setPromptStatus("fetched"));
        setPage(1);
      });
  };

  const elaborateByGPT = useCallback(() => {
    const selection = $getSelection();
    const selected_text = selection.getTextContent();
    if ($isRangeSelection(selection)) {
      console.log(`selection: ${selected_text}`);

      const fetchPromise = fetch(
        "http://https://visar.app/api/?" +
          new URLSearchParams({
            prompt: selected_text,
            mode: "elaborate",
          }),
        {
          mode: "no-cors",
        }
      );

      fetchPromise
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          let text = res["response"].trim();

          editor.update(() => {
            // replace \n with space

            text = text.replace(/\\n/g, " ");
            text = " " + text;

            // // Create a new TextNode
            const newTextNode = $createTextNode(text);
            // console.log(`new text node key: ${newTextNode.getKey()}`)

            //   // Append the text node to the paragraph
            //   paragraphNode.append(textNode);

            //   // Finally, append the paragraph to the root
            //   root.append(paragraphNode);

            // selection.insertText(selected_text + " " + text + " ");
            const curTextNode = selection.getNodes()[0];
            const parent_key = curTextNode.getParentKeys()[0];
            var parent = $getNodeByKey(parent_key);
            if ($isParagraphNode(parent)) {
              parent.append(newTextNode);
              // console.log(`paragraph children: ${parent.getChildren()}}`)
              addDependency(curTextNode, newTextNode, "elaboratedBy");
            }
          });

          editor.dispatchCommand(SHOW_LOADING_COMMAND, { show: false });
        });
    } else {
      console.log("It is not range selection");
    }
  }, [editor]);

  useEffect(() => {
    // console.log(`isElaborate changed: ${isElaborate}`)
    editor.getEditorState().read(() => {
      updateFloatingGroup();
    });
  }, [editor, isElaborate]);

  useEffect(() => {
    // const buttonElem = buttonRef.current;
    // const nativeSelection = window.getSelection();
    // const rootElement = editor.getRootElement();

    return mergeRegister(
      editor.registerCommand(
        ELABORATE_COMMAND,
        () => {
          // console.log(`ELABORATE_COMMAND listener is called`);
          dispatch(initPrompts());
          dispatch(setType("elaborate"));
          setFetchingKeyword(true);
          setElaborate(true);
          fetchKeyword();
          // console.log(`isElaborate: ${isElaborate}`)
          // updateFloatingGroup();
          return true;
        },
        lowPriority
      ),

      editor.registerCommand(
        EVIDENCE_COMMAND,
        () => {
          console.log(`EVIDENCE_COMMAND listener is called`);
          dispatch(initPrompts());
          dispatch(setType("evidence"));
          setFetchingKeyword(true);
          setElaborate(true);
          fetchKeyword();
          // console.log(`isElaborate: ${isElaborate}`)
          // updateFloatingGroup();
          return true;
        },
        lowPriority
      ),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const selection = $getSelection();
          setElaborate(false);
          setPromptedText(selection.getTextContent());
          const selectedNodeKey = selection.getNodes()[0].__key;
          dispatch(setCurRangeNodeKey(selectedNodeKey))
          dispatch(setNodeSelected(selectedNodeKey))
          return false;
        },
        highPriority
      )
    );
  }, [editor, setCurSelectedNodeKey]);

  const onCLickElaboratePredict = () => {
    editor.update(() => {
      editor.dispatchCommand(SHOW_LOADING_COMMAND, { show: true });
      setElaborate(false);
      elaborateByGPT();
    });
  };

  const handleChipClick = (r) => {
    dispatch(toggleElabPromptKeywords(r));
    if (page > Math.ceil(prompts.length / itemPerPage)) {
      setPage(Math.max(Math.ceil(prompts.length / itemPerPage) - 1, 0));
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleTabChange = (event, value) => {
    setTabValue(value);
    setPage(1);
  };

  const handleAlertClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setFetchingAlertOpen(false);
  };

  // const handleChipDelete = (r) => {
  //   console.log(r);
  //   dispatch(toggleElabPromptKeywords(r));
  //   if (page > Math.ceil(prompts.length / itemPerPage)) {
  //     setPage(Math.max(Math.ceil(prompts.length / itemPerPage) - 1, 0));
  //   }
  // };

  const handleContentSketchingClicked = (e) => {
    dispatch(loadNodes({ selectedText: promptedText, selectedKeywords: selectedKeywords , discussionPoints: selectedPrompts, curRangeNodeKey: curRangeNodeKey}));
    dispatch(setFlowModalOpen());
    dispatch(setRangeGenerationMode(true))
    positionFloatingButton(buttonRef.current, null);
    dispatch(setPromptStatus("empty"))
    dispatch(setIsReactFlowInModal())
  };

  return (
    <div ref={buttonRef} className="elaborate-group">
      {isFetchingKeyword ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography sx={{ mr: 4 }}>Looking for keywords...</Typography>
          <CircularProgress size={20} />
        </Box>
      ) : (
        <Box>
          <Typography sx={{ mb: 2 }}>
            Please select the keywords to explore:
          </Typography>
          <Grid
            container
            spacing={1}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mb: 1,
            }}
          >
            {allKeywords.map((r, index) => {
              return (
                <Grid
                  item
                  xs
                  key={index}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Tooltip title={r} key={index}>
                    <Chip
                      key={index}
                      label={r}
                      onClick={() => handleChipClick(r)}
                      color="primary"
                      variant={ selectedKeywords.includes(r) ? "filled" : "outlined"}
                    />
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>

          {promptStatus === "empty" ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                sx={{
                  height: 30,
                  mt: 2,
                  justifyContent: "center",
                  alignItems: "center",
                  mb: 2,
                }}
                onClick={() => fetchDiscussionPoints()}
              >
                Generate discussion points
              </Button>
            </Box>
          ) : promptStatus === "fetching" ? (
            <Box>
              <Skeleton animation="wave" />
              <Skeleton animation="wave" />
              <Skeleton animation="wave" />
              <Skeleton animation="wave" />

              <Snackbar
                open={fetchingAlertOpen}
                autoHideDuration={4000}
                onClose={handleAlertClose}
              >
                <Alert
                  onClose={handleAlertClose}
                  severity="success"
                  sx={{ width: "100%" }}
                >
                  Preparing discussion points...
                </Alert>
              </Snackbar>
            </Box>
          ) : (
            <Box>
              <Typography sx={{ mb: 2, mt: 2 }}>
                Potential discussion points:
              </Typography>
              <Box>
                <Box>
                  <Tabs value={tabValue} onChange={handleTabChange} scrollButtons="auto" variant="scrollable">
                    {selectedKeywords.map((r, index) => {
                      return <Tab key={index} label={r} color="primary" />;
                    })}
                  </Tabs>
                </Box>
                {selectedKeywords.map((r, tindex) => {
                  return (
                    <Box
                      key={tindex}
                      index={tindex}
                      hidden={tabValue !== tindex}
                      role="tabpanel"
                    >
                      {tabValue === tindex && (
                        <Box>
                          <Stack spacing={1}>
                            {prompts
                              .filter((p) => p["keyword"] === r)
                              .map((p, index) => {
                                if (
                                  index >= (page - 1) * itemPerPage &&
                                  index < page * itemPerPage
                                ) {
                                  return (
                                    <Tooltip title={p["prompt"]} key={index}>
                                      <Chip
                                        key={index}
                                        label={p["prompt"]}
                                        onClick={() =>
                                          dispatch(
                                            handleSelectedPromptsChanged(p)
                                          )
                                        }
                                        color="primary"
                                        variant={
                                          selectedPrompts.includes(p)
                                            ? "primary"
                                            : "outlined"
                                        }
                                      />
                                    </Tooltip>
                                  );
                                }
                              })}
                          </Stack>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              mt: 2,
                            }}
                          >
                            <Pagination
                              count={Math.ceil(
                                prompts.filter((p) => p["keyword"] === r)
                                  .length / itemPerPage
                              )}
                              page={page}
                              onChange={handlePageChange}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Button
                  variant="contained"
                  sx={{
                    height: 30,
                    mt: 2,
                    justifyContent: "center",
                    alignItems: "center",
                    mb: 2,
                  }}
                  onClick={handleContentSketchingClicked}
                >
                  Sketch content
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </div>
  );
}
