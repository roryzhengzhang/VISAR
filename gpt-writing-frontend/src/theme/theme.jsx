import { createTheme } from '@mui/material/styles';
import "@fontsource/varela-round"

const theme = createTheme({
    "typography": {
        "fontFamily": "\"Varela Round\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"",
        "h1": {
            fontWeight: 'bold'
        },
        "h2": {
            fontWeight: 'bold'
        },
        "h3": {
            fontWeight: 'bold'
        },
        "h4": {
            fontWeight: 'bold'
        },
        "h5": {
            fontWeight: 'bold'
        },
        "h6": {
            fontWeight: 'bold'
        },

    },
    "palette": {
        "background": {
            "default": "#FFF",
            "emphasis": "#E8EAF6",
            "secondary": "#C5CAE9",
            "header": "#121037"
        },
        "text": {
            "primary": "#222222",
            "secondary": "#777777",
            "hint": "#9FA8DA"
        },
        "primary": {
            "main": "#189483",
            "light": "#58c5b2",
            "dark": "#006556"
        },
        "secondary": {
            "main": "#FFAB00",
            "light": "#ffd740",
            "dark": "#ff8f00"
        },
        "contrastThreshold": 1.8
    }
});

export default theme;