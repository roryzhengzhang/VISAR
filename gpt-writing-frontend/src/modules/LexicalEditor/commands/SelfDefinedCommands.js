import { createCommand } from "lexical";

const COMPLETE_COMMAND = createCommand();
const ADD_EXAMPLE_COMMAND = createCommand();
const SHOW_DEPENDENCY_COMMAND = createCommand();
const ELABORATE_COMMAND = createCommand();
const SHOW_LOADING_COMMAND = createCommand();

const lowPriority = 1;

export {COMPLETE_COMMAND, SHOW_LOADING_COMMAND, ADD_EXAMPLE_COMMAND, SHOW_DEPENDENCY_COMMAND, ELABORATE_COMMAND, lowPriority};