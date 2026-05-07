import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";

/**
 * When the user types `do: ` (or `todo: `) at the start of an empty paragraph,
 * convert that paragraph into a taskList with a single empty taskItem so the
 * caret continues writing inside the new task.
 */
export const DoColonExtension = Extension.create({
  name: "doColon",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("doColonInputRule"),
        props: {
          handleTextInput(view, from, _to, text) {
            if (text !== " ") return false;
            const { state } = view;
            const { $from } = state.selection;
            const lineStart = $from.start();
            const before = state.doc.textBetween(lineStart, from, "\n", "\n") + text;
            const m = before.match(/^(do|todo):\s$/i);
            if (!m) return false;

            const { schema } = state;
            const taskList = schema.nodes.taskList;
            const taskItem = schema.nodes.taskItem;
            const paragraph = schema.nodes.paragraph;
            if (!taskList || !taskItem || !paragraph) return false;

            const para = $from.node($from.depth);
            if (para.type.name !== "paragraph") return false;
            const paraStart = $from.before($from.depth);
            const paraEnd = paraStart + para.nodeSize;

            const newItem = taskItem.create({ checked: false }, paragraph.create());
            const newList = taskList.create(null, [newItem]);

            const tr = state.tr.replaceWith(paraStart, paraEnd, newList);
            const insertPos = paraStart + 2 + 1; // into the inner paragraph
            tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos)));
            view.dispatch(tr);
            return true;
          },
        },
      }),
    ];
  },
});
