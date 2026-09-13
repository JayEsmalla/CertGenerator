# CertStudio

CertStudio is being rebuilt as a general-purpose certificate design and batch-generation application for schools, companies, hospitals, government offices, clubs, NGOs, event organizers, and other organizations.

## Current rebuild status

The project now uses **React + TypeScript + Vite** and is organized around a four-stage workflow:

1. **Templates** — choose a reusable starting design.
2. **Editor** — customize certificate content and layout.
3. **Recipients** — import, map, review, and edit recipient data.
4. **Generate** — preview and export personalized certificates.

The legacy single-certificate HTML implementation has been retired so the new architecture can support reusable template documents and batch data safely.

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

## Planned implementation order

- Data-driven certificate template schema and starter template gallery
- Editable certificate canvas and property controls
- Merge fields such as `{{name}}`, `{{event}}`, and arbitrary custom data
- DOCX/CSV/XLSX/TXT recipient import with review and field mapping
- Recipient-by-recipient preview and overflow handling
- Individual PDF, combined PDF, and ZIP batch export
- Local project/template persistence and reusable organization branding
