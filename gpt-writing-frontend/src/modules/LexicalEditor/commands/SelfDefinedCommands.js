import { createCommand } from "lexical";

const COMPLETE_COMMAND = createCommand();
const ADD_EXAMPLE_COMMAND = createCommand();
const SHOW_DEPENDENCY_COMMAND = createCommand();
const ELABORATE_COMMAND = createCommand();
const SHOW_LOADING_COMMAND = createCommand();
const GEN_TEXT_FROM_SKETCH_COMMAND = createCommand();
const REWRITE_COMMAND = createCommand();
const SHOW_WEAKNESS_COMMAND = createCommand();
const SHOW_COUNTER_ARGUMENT_COMMAND = createCommand();
const ADD_TO_GRAPH_COMMAND = createCommand();
const SHOW_SUPPORT_COMMAND = createCommand();
const ARGUMENTATIVE_COMMAND = createCommand();

const lowPriority = 1;
const highPriority = 2;

const EVIDENCE_COMMAND = createCommand();
export {ARGUMENTATIVE_COMMAND, SHOW_SUPPORT_COMMAND, ADD_TO_GRAPH_COMMAND, COMPLETE_COMMAND, SHOW_WEAKNESS_COMMAND, SHOW_COUNTER_ARGUMENT_COMMAND, REWRITE_COMMAND, SHOW_LOADING_COMMAND, ADD_EXAMPLE_COMMAND, SHOW_DEPENDENCY_COMMAND, ELABORATE_COMMAND, EVIDENCE_COMMAND, GEN_TEXT_FROM_SKETCH_COMMAND, lowPriority, highPriority};