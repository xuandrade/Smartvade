import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { FontFamily } from '@tiptap/extension-font-family';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Extension } from '@tiptap/core';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, RemoveFormatting, Undo, Redo, Palette, Highlighter, Type, Plus, Minus } from 'lucide-react';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
});

interface RichNoteEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

const FONT_SIZES = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '30px'];

export function RichNoteEditor({ initialContent, onChange }: RichNoteEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      Underline,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // Debounced save handled separately
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[120px] p-4 bg-stone-50 border border-stone-200 rounded-b-xl',
      },
    },
  });

  const [textColor, setTextColor] = useState('#333333');
  const [highlightColor, setHighlightColor] = useState('#fde047');
  const [currentFontSizeIndex, setCurrentFontSizeIndex] = useState(3); // 16px default

  // Auto-save logic (1 second debounce)
  useEffect(() => {
    if (!editor) return;
    
    let timeout: NodeJS.Timeout;
    
    const handleUpdate = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        onChange(editor.getHTML());
      }, 1000);
    };

    editor.on('update', handleUpdate);
    
    return () => {
      clearTimeout(timeout);
      editor.off('update', handleUpdate);
    };
  }, [editor, onChange]);

  if (!editor) {
    return null;
  }

  const handleTextColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextColor(e.target.value);
    editor.chain().focus().setColor(e.target.value).run();
  };

  const handleHighlightColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHighlightColor(e.target.value);
    editor.chain().focus().setHighlight({ color: e.target.value }).run();
  };

  const increaseFontSize = () => {
    if (currentFontSizeIndex < FONT_SIZES.length - 1) {
      const newIndex = currentFontSizeIndex + 1;
      setCurrentFontSizeIndex(newIndex);
      // @ts-ignore
      editor.chain().focus().setFontSize(FONT_SIZES[newIndex]).run();
    }
  };

  const decreaseFontSize = () => {
    if (currentFontSizeIndex > 0) {
      const newIndex = currentFontSizeIndex - 1;
      setCurrentFontSizeIndex(newIndex);
      // @ts-ignore
      editor.chain().focus().setFontSize(FONT_SIZES[newIndex]).run();
    }
  };

  return (
    <div className="flex flex-col border border-stone-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center gap-1 bg-white border-b border-stone-200 p-2">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-stone-100 ${editor.isActive('bold') ? 'bg-stone-200 text-blush-600' : 'text-stone-600'}`}><Bold size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-stone-100 ${editor.isActive('italic') ? 'bg-stone-200 text-blush-600' : 'text-stone-600'}`}><Italic size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded hover:bg-stone-100 ${editor.isActive('underline') ? 'bg-stone-200 text-blush-600' : 'text-stone-600'}`}><UnderlineIcon size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded hover:bg-stone-100 ${editor.isActive('strike') ? 'bg-stone-200 text-blush-600' : 'text-stone-600'}`}><Strikethrough size={16} /></button>
        
        <div className="w-px h-6 bg-stone-200 mx-1"></div>
        
        <button onClick={decreaseFontSize} className="p-1.5 rounded hover:bg-stone-100 text-stone-600 flex items-center gap-0.5" title="Diminuir Fonte"><Type size={12} /><Minus size={10} /></button>
        <button onClick={increaseFontSize} className="p-1.5 rounded hover:bg-stone-100 text-stone-600 flex items-center gap-0.5" title="Aumentar Fonte"><Type size={16} /><Plus size={12} /></button>
        
        <div className="w-px h-6 bg-stone-200 mx-1"></div>
        
        <div className="flex items-center gap-1 relative group">
           <Palette size={16} className="text-stone-600" />
           <input type="color" value={textColor} onChange={handleTextColor} className="w-6 h-6 p-0 border-0 rounded cursor-pointer" title="Cor do Texto" />
        </div>
        
        <div className="flex items-center gap-1 relative group ml-2">
           <Highlighter size={16} className="text-stone-600" />
           <input type="color" value={highlightColor} onChange={handleHighlightColor} className="w-6 h-6 p-0 border-0 rounded cursor-pointer" title="Cor do Marca-texto" />
        </div>
        
        <div className="w-px h-6 bg-stone-200 mx-1"></div>
        <button onClick={() => { 
           editor.chain().focus().unsetAllMarks().clearNodes().run();
           // @ts-ignore 
           editor.chain().focus().unsetFontSize().run(); 
        }} className="p-1.5 rounded hover:bg-stone-100 text-stone-600" title="Limpar Formatação"><RemoveFormatting size={16} /></button>
        
        <div className="w-px h-6 bg-stone-200 mx-1"></div>
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 rounded hover:bg-stone-100 text-stone-600 disabled:opacity-50"><Undo size={16} /></button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 rounded hover:bg-stone-100 text-stone-600 disabled:opacity-50"><Redo size={16} /></button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
