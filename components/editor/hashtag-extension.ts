import { Mark, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const HASHTAG_RE = /(^|\s)(#[\p{L}0-9_-]{1,64})/gu;

/**
 * Lightweight hashtag highlighter: paints `#word` tokens inline using
 * ProseMirror decorations. Doesn't change the document structure so the
 * markdown round-trip stays clean.
 */
export const HashtagExtension = Mark.create({
  name: "hashtagHighlighter",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("hashtagHighlights"),
        props: {
          decorations(state) {
            const decos: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              const text = node.text;
              for (const match of text.matchAll(HASHTAG_RE)) {
                const tagStart = match.index! + match[1].length;
                const tagEnd = tagStart + match[2].length;
                decos.push(
                  Decoration.inline(pos + tagStart, pos + tagEnd, { class: "pisi-hashtag" }),
                );
              }
            });
            return DecorationSet.create(state.doc, decos);
          },
        },
      }),
    ];
  },
  parseHTML() {
    return [];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "pisi-hashtag" }), 0];
  },
});
