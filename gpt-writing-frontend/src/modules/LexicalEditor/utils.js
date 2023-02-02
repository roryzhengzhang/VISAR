import { $getRoot, $createTextNode, $isParagraphNode } from "lexical";
import { $createHighlightDepNode } from "./nodes/HighlightDepNode";

export function positionFloatingButton(buttonGroup, rect) {
    if (rect === null) {
        buttonGroup.style.opacity = "0";
        buttonGroup.style.top = "-1000px";
        buttonGroup.style.left = "-1000px";
    } else {
        console.log(`height: ${rect.height}, top: ${rect.top}, left: ${rect.left}, width: ${rect.width}`)
        buttonGroup.style.opacity = "1";
        buttonGroup.style.top = `${rect.top + rect.height + window.pageYOffset + 10}px`;
        buttonGroup.style.left = `${rect.left + window.pageXOffset - buttonGroup.offsetWidth / 2 + rect.width / 2}px`;
        console.log(`buttonGroup: top: ${buttonGroup.style.top}, left: ${buttonGroup.style.left}`)
    }
}

export function highlightDepText(editor, res) {

    var search_strs = [];

    res = [...new Set(res)];

    res.forEach(element => {

        editor.update(() => {
            const dep_node = element.get('n2');
            const rel = element.get('r');
            let dep_text = dep_node.properties.content;
            if (dep_text.charAt(0) === ' ') {
                dep_text = dep_text.substring(1);
            }

            search_strs.push({text: dep_text, rel_type: rel.type});

        });
    }); 

    editor.update(()=> {

        const children = $getRoot().getChildren();
        for (const child of children) {
            if (!$isParagraphNode(child)) {
                continue;
            }
            const paragraphNode = child;
            const text = child.getTextContent();
     
            const indexes = [];
            let result;

            search_strs.forEach(e => {

                const searchStr = String(e.text).replace('{', '\{').replace('}', '\}').replace('(', '\(').replace(')', '\)').replace('.', '\.').replace(/\\/g, "\\\\");
                const searchStrLen = searchStr.length;
                const regex = new RegExp(searchStr, 'gim');

                while ((result = regex.exec(text)) !== null) {
                    indexes.push({start: result.index, end: result.index + searchStrLen, rel_type: e.rel_type});
                }

            });

            if (indexes.length === 0) {
                continue;
            }

            console.log(indexes)
    
            paragraphNode.clear();
    
            const chunks = [];
    
            if (indexes[0].start !== 0) {
                chunks.push({start: 0, end: indexes[0].start, rel_type: undefined});
            }
            

            for (let i = 0; i < indexes.length; i++) {

                chunks.push({start: indexes[i].start, end: indexes[i].end, rel_type: indexes[i].rel_type});

                if ( i < indexes.length -1 && indexes[i].end !== indexes[i+1].start) { 
                    chunks.push({start: indexes[i].end, end: indexes[i+1].start, rel_type: undefined});
                }

            }
    
            if (chunks.at(-1).end !== text.length) {
                chunks.push({start: indexes.at(-1).end, end: text.length, rel_type: undefined});
            }

            console.log(chunks)

    
            for (let i = 0; i < chunks.length; i++) {

                var textNode;
                if (chunks[i].rel_type === "elaboratedBy") {
                    textNode = $createHighlightDepNode("highlight-dep-elb", text.slice(chunks[i].start, chunks[i].end));
                } else {
                    textNode = $createTextNode(text.slice(chunks[i].start, chunks[i].end));
                }
                paragraphNode.append(textNode);

                // const start = chunks[i];
                // const end = chunks[i + 1];
                // let textNode;
                // if (indexes.includes(start)) {

                //     console.log(`search str: ${search_str}`)

                //     if(dep_rel !== undefined && dep_rel.type === rel_type) {
                //         textNode = $createHighlightDepNode(hl_type, text.slice(start, end));
                //     } else {
                //         textNode = $createHighlightDepNode(hl_type, text.slice(start, end));
                //     }
                // } else {
                //     textNode = $createTextNode(text.slice(start, end));
                // }

            }
        }
    })
}

export function highlightCertainText() {

}