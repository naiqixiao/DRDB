<template>
  <div class="rich-text-editor" :class="{ 'editor-focused': isFocused }">
    <!-- Toolbar -->
    <div class="editor-toolbar" v-if="editor">
      <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }" title="Bold">
        <v-icon size="18">mdi-format-bold</v-icon>
      </button>
      <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }" title="Italic">
        <v-icon size="18">mdi-format-italic</v-icon>
      </button>
      <button type="button" @click="editor.chain().focus().toggleUnderline().run()" :class="{ 'is-active': editor.isActive('underline') }" title="Underline">
        <v-icon size="18">mdi-format-underline</v-icon>
      </button>

      <span class="toolbar-divider"></span>

      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }" title="Heading">
        <v-icon size="18">mdi-format-header-3</v-icon>
      </button>

      <span class="toolbar-divider"></span>

      <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }" title="Bullet List">
        <v-icon size="18">mdi-format-list-bulleted</v-icon>
      </button>
      <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }" title="Numbered List">
        <v-icon size="18">mdi-format-list-numbered</v-icon>
      </button>

      <span class="toolbar-divider"></span>

      <button type="button" @click="setLink" :class="{ 'is-active': editor.isActive('link') }" title="Insert Link">
        <v-icon size="18">mdi-link-variant</v-icon>
      </button>
      <button type="button" v-if="editor.isActive('link')" @click="editor.chain().focus().unsetLink().run()" title="Remove Link">
        <v-icon size="18">mdi-link-variant-off</v-icon>
      </button>

      <span class="toolbar-divider"></span>

      <button type="button" @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()" title="Insert Table">
        <v-icon size="18">mdi-table-plus</v-icon>
      </button>

      <span class="toolbar-divider"></span>

      <button type="button" @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" title="Undo">
        <v-icon size="18">mdi-undo</v-icon>
      </button>
      <button type="button" @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" title="Redo">
        <v-icon size="18">mdi-redo</v-icon>
      </button>
    </div>

    <!-- Editor content -->
    <editor-content :editor="editor" class="editor-content" />
  </div>
</template>

<script>
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

export default {
  name: 'RichTextEditor',
  components: { EditorContent },
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      editor: null,
      isFocused: false,
    };
  },
  watch: {
    modelValue(value) {
      if (this.editor && this.editor.getHTML() !== value) {
        this.editor.commands.setContent(value || '', false);
      }
    },
  },
  mounted() {
    this.editor = new Editor({
      content: this.modelValue || '',
      extensions: [
        StarterKit,
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
        }),
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
      ],
      onUpdate: ({ editor }) => {
        this.$emit('update:modelValue', editor.getHTML());
      },
      onFocus: () => { this.isFocused = true; },
      onBlur: () => { this.isFocused = false; },
    });
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
  },
  methods: {
    setLink() {
      const previousUrl = this.editor.getAttributes('link').href;
      const url = window.prompt('Enter URL:', previousUrl || 'https://');
      if (url === null) return; // cancelled
      if (url === '') {
        this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
      }
      this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    },
  },
};
</script>

<style>
/* Editor container */
.rich-text-editor {
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
  background: white;
}

.rich-text-editor.editor-focused {
  border-color: rgb(var(--v-theme-primary));
}

/* Toolbar */
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  background: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
  flex-wrap: wrap;
}

.editor-toolbar button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #64748B;
  transition: all 0.15s;
}

.editor-toolbar button:hover {
  background: #E2E8F0;
  color: #1E293B;
}

.editor-toolbar button.is-active {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.editor-toolbar button:disabled {
  opacity: 0.3;
  cursor: default;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #E2E8F0;
  margin: 0 4px;
}

/* Editor content area */
.editor-content .tiptap {
  padding: 16px 20px;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  outline: none;
  font-size: 0.9rem;
  line-height: 1.65;
  color: #1E293B;
}

.editor-content .tiptap p {
  margin: 0 0 0.5em 0;
}

.editor-content .tiptap h3 {
  margin: 0.8em 0 0.4em;
  font-weight: 700;
}

.editor-content .tiptap ul,
.editor-content .tiptap ol {
  padding-left: 1.5em;
  margin: 0.3em 0;
}

.editor-content .tiptap a {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  cursor: pointer;
}

.editor-content .tiptap table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5em 0;
}

.editor-content .tiptap table td,
.editor-content .tiptap table th {
  border: 1px solid #E2E8F0;
  padding: 6px 10px;
  text-align: left;
}

.editor-content .tiptap table th {
  background: #F1F5F9;
  font-weight: 700;
}

.editor-content .tiptap blockquote {
  border-left: 3px solid #E2E8F0;
  padding-left: 12px;
  margin: 0.5em 0;
  color: #64748B;
}

/* Placeholder */
.editor-content .tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #94A3B8;
  pointer-events: none;
  height: 0;
}
</style>
