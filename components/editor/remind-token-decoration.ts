import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { format, isToday, isTomorrow } from "date-fns";

// Match `[@<ISO>]` tokens in the editor and render them as styled chips. The
// raw token stays in the document so it round-trips through tiptap-markdown
// unchanged, but we visually hide the chars and inject a friendly label in
// front of them via a widget decoration.
const TOKEN_RE = /\[@(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)\]/g;

function chipLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (isToday(d)) return `today ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `tomorrow ${format(d, "h:mm a")}`;
  return format(d, "EEE M/d h:mm a");
}

export const RemindTokenDecoration = Extension.create({
  name: "remindTokenDecoration",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("remindTokenDecoration"),
        props: {
          decorations(state) {
            const decos: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              for (const m of node.text.matchAll(TOKEN_RE)) {
                if (m.index === undefined) continue;
                const start = pos + m.index;
                const end = start + m[0].length;
                const iso = m[1];
                decos.push(
                  Decoration.widget(
                    start,
                    () => {
                      const span = document.createElement("span");
                      span.className = "pisi-remind-chip";
                      span.contentEditable = "false";
                      span.textContent = chipLabel(iso);
                      return span;
                    },
                    { side: -1, ignoreSelection: true },
                  ),
                );
                decos.push(
                  Decoration.inline(start, end, { class: "pisi-remind-token-raw" }),
                );
              }
            });
            return DecorationSet.create(state.doc, decos);
          },
        },
      }),
    ];
  },
});
