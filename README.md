# CertStudio

CertStudio is a general-purpose certificate design and batch-generation application for schools, companies, hospitals, government offices, clubs, NGOs, event organizers, and other organizations.

The original single-certificate HTML prototype has been rebuilt with **React + TypeScript + Vite** around a reusable template/document model.

## Workflow

1. **Templates** — choose from six starter designs or a custom template saved locally.
2. **Editor** — customize text, shapes, lines, uploaded images, typography, colors, position, size, rotation, opacity, locking, and layer order.
3. **Recipients** — import recipient data, review every row, rename/map fields, disable unwanted records, and preview merged certificates.
4. **Generate** — export a selected recipient PDF, one combined multi-page PDF, or a ZIP containing individual PDFs.

## Recipient imports

Supported import formats:

- **DOCX** — Word tables are detected and mapped as structured recipient data. If there is no table, non-empty paragraphs/list items are imported as candidate names for review.
- **CSV** — rows and recognizable headers are imported into editable merge fields.
- **TXT** — each non-empty line is treated as a candidate recipient name.

CertStudio intentionally shows an editable review table before generation instead of blindly treating every line in a document as a valid recipient.

## Merge fields

Certificate text can contain merge placeholders such as:

```text
{{name}}
{{organization}}
{{event}}
{{award}}
{{role}}
{{date}}
{{signatory}}
```

Imported column names can be renamed to match template fields, and custom field names are also supported.

## Design editor

The certificate canvas supports:

- Dragging and resizing elements
- Text editing and typography controls
- Shapes and divider lines
- Uploaded PNG, JPEG, WebP, and SVG images for logos, signatures, seals, or decorative artwork
- Image fit and corner-radius controls
- Rotation and opacity
- Locking elements
- Duplicate/delete actions
- Layer ordering
- Document background and accent colors
- Reusable custom templates

## Local persistence

Projects auto-save in the browser with **IndexedDB**, including the current design, imported recipient data, uploaded images, and workflow position. Saved custom templates are stored separately and remain available in the template library after reload.

No server account is required for the current local-first workflow.

## Export options

CertStudio renders exports from the same certificate component used for previewing, reducing the risk of preview/export layout differences.

Available outputs:

- Selected recipient PDF
- Combined multi-page PDF for all enabled recipients
- ZIP archive containing one PDF per enabled recipient

## Local development

```bash
npm install
npm run dev
```

Validation:

```bash
npm run typecheck
npm run build
```

## Main browser-side libraries

- React + TypeScript + Vite
- Mammoth for DOCX extraction
- html2canvas for certificate rendering
- jsPDF for PDF generation
- JSZip for individual-certificate archives
