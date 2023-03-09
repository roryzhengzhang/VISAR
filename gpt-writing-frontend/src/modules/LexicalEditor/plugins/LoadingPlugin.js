import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useState } from "react";
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { lowPriority, SHOW_LOADING_COMMAND } from "../commands/SelfDefinedCommands";
import { mergeRegister } from "@lexical/utils";

export default function LoadingPlugin() {
    const [editor] = useLexicalComposerContext();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                SHOW_LOADING_COMMAND,
                (_payload) => {
                    const show = _payload.show;
                    console.log("loading show: ", show)
                    if (show === true) {
                        console.log("show loading")
                        setLoading(true);
                    } else {
                        setLoading(false);
                    }
                },
                lowPriority
            ),
        )
    }, [editor])

    return (
        <div>
            {loading &&
                <Box sx={{ width: '100%' }}>
                    <LinearProgress />
                </Box>}
        </div>
    )
}