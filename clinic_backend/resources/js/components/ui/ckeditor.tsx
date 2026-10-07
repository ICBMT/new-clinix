import React, { useEffect, useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

interface CKEditorComponentProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function CKEditorComponent({ 
    value, 
    onChange, 
    placeholder = '', 
    disabled = false,
    className = ''
}: CKEditorComponentProps) {
    const editorRef = useRef<any>(null);

    // Store editor reference for potential cleanup
    // Note: CKEditor handles its own cleanup, but we store the reference
    // in case we need it for other purposes

    return (
        <div className={`ckeditor-wrapper ${className}`}>
            <style>{`
                .ckeditor-wrapper .ck-editor__editable {
                    background-color: var(--background) !important;
                    color: var(--foreground) !important;
                    min-height: 200px;
                }
                .ckeditor-wrapper .ck-editor__editable.ck-focused {
                    border-color: hsl(var(--ring)) !important;
                }
                .ckeditor-wrapper .ck-toolbar {
                    background-color: var(--muted) !important;
                    border-color: hsl(var(--border)) !important;
                }
                .ckeditor-wrapper .ck-button {
                    color: var(--foreground) !important;
                }
                .ckeditor-wrapper .ck-button:hover {
                    background-color: var(--accent) !important;
                }
                .ckeditor-wrapper .ck-button.ck-on {
                    background-color: var(--accent) !important;
                }
                .ckeditor-wrapper .ck-dropdown__panel {
                    background-color: var(--background) !important;
                    border-color: hsl(var(--border)) !important;
                }
                .ckeditor-wrapper .ck-list__item {
                    color: var(--foreground) !important;
                }
                .ckeditor-wrapper .ck-list__item:hover {
                    background-color: var(--accent) !important;
                }
            `}</style>
            <CKEditor
                editor={ClassicEditor}
                data={value}
                onReady={(editor) => {
                    editorRef.current = editor;
                    editor.editing.view.change((writer: any) => {
                        writer.setStyle('min-height', '200px', editor.editing.view.document.getRoot());
                    });
                }}
                onChange={(event, editor) => {
                    const data = editor.getData();
                    onChange(data);
                }}
                onBlur={(event, editor) => {
                    // Handle blur if needed
                }}
                onFocus={(event, editor) => {
                    // Handle focus if needed
                }}
                onError={(error, { willEditorRestart }) => {
                    // Handle errors during editor lifecycle
                    // Silently handle unmounting errors
                    if (!willEditorRestart) {
                        // This is likely an unmounting error, ignore it
                        return;
                    }
                    // For other errors, you might want to log or handle them
                    console.warn('CKEditor error:', error);
                }}
                config={{
                    placeholder: placeholder,
                    toolbar: {
                        items: [
                            'heading',
                            '|',
                            'bold',
                            'italic',
                            'underline',
                            'strikethrough',
                            '|',
                            'bulletedList',
                            'numberedList',
                            '|',
                            'outdent',
                            'indent',
                            '|',
                            'blockQuote',
                            'insertTable',
                            '|',
                            'link',
                            '|',
                            'undo',
                            'redo'
                        ]
                    },
                    language: 'en',
                    table: {
                        contentToolbar: [
                            'tableColumn',
                            'tableRow',
                            'mergeTableCells'
                        ]
                    }
                }}
                disabled={disabled}
            />
        </div>
    );
}
