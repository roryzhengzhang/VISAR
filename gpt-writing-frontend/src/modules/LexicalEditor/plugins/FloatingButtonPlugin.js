import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { mergeRegister } from "@lexical/utils";
import {
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $setSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  $isParagraphNode,
  $isTextNode,
  $createRangeSelection,
  $getRoot,
  $createTextNode,
  createCommand,
} from "lexical";
import { GEN_TEXT_FROM_SKETCH_COMMAND, lowPriority } from "../commands/SelfDefinedCommands";
import { createPortal } from "react-dom";
import { addGenerationsFromSketch } from "../utils";
import { FloatingMenu } from "../widgets/FloatingMenu";
import ElaborateFLoatingGroup from "../widgets/ElaborateFloatGroup";
import { setFlowEditorNodeMapping } from "../slices/FlowSlice";
import { TextBlockMenu } from "../widgets/TextBlockMenu";
import RewriteMenu from "../widgets/RewriteMenu";
import WeaknessFloatGroup from "../widgets/WeaknessFloatGroup";
import CounterArgumentMenu from "../widgets/CounterArgumentMenu";
import SupportingEvidenceMenu from "../widgets/SupportingEvidenceMenu";
import ControlConditionMenu from "../widgets/ControlConditionMenu";
import { ArgumentativeMenu } from "../widgets/ArgumentativeMenu";

export default function FloatingButtonPlugin() {
  const [editor] = useLexicalComposerContext();
  const pluginRef = useRef(null);
  const dispatch = useDispatch();
  const gen_type = useSelector((state) => state.editor.type);
  const curRangeNodeKey = useSelector((state) => state.editor.curRangeNodeKey);
  // sync global floweditor node mapping to local state
  const [mapping, setMapping] = useState({});
  const condition = useSelector((state) => state.editor.condition);

  useEffect(() => {

    return mergeRegister(

      editor.registerCommand(
        GEN_TEXT_FROM_SKETCH_COMMAND,
        (_payload, newEditor) => {

          const flowNodeMapping = addGenerationsFromSketch(editor, _payload, gen_type, curRangeNodeKey);

          return false;
        },
        lowPriority
      )
    );
  }, [editor, curRangeNodeKey]);

  return (
    <div ref={pluginRef}>
      {condition === "control" && createPortal(<ControlConditionMenu editor={editor} />, document.body)}
      {condition === "advanced" && createPortal(<FloatingMenu editor={editor} />, document.body)}
      {condition === "advanced" && createPortal(<ElaborateFLoatingGroup editor={editor} />, document.body)}
      {condition === "advanced" && createPortal(<WeaknessFloatGroup editor={editor} />, document.body)}
      {condition === "advanced" && createPortal(<TextBlockMenu editor={editor} />, document.body)}
      {condition === "advanced" && createPortal(<RewriteMenu editor={editor} />, document.body)}
      {condition === "advanced" && createPortal(<ArgumentativeMenu editor={editor} />, document.body)}
      {condition === "advanced" && createPortal(<CounterArgumentMenu editor={editor} />, document.body)}
      {condition === "advanced" && createPortal(<SupportingEvidenceMenu editor={editor} />, document.body)}
    </div>
  );
}
