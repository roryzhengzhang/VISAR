import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box, Typography } from "@mui/material";
import { useSelector } from "react-redux";

export default function TaskDescriptionPlugin() {
    const [editor] = useLexicalComposerContext();
    const taskDescription = useSelector(state => state.editor.taskDescription)

    return (
        <Box sx={{ borderTop: "solid", height: "16vh", padding: 2 }}>
            {
                taskDescription && (
                    <Box>
                    <Typography variant="h6">Argumentative statement</Typography>
                    <Typography variant="body"><i>{taskDescription["topic"]}</i></Typography>
                    <Typography variant="h6">Task description</Typography>
                    <Typography variant="body">{taskDescription["description"]}</Typography>
                    </Box>
                )
            }
        </Box>
    )
}