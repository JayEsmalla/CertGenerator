# CertStudio - Premium Generalized Certificate Customization & Design Suite

Welcome to **CertStudio**, a professional, highly customizable, and print-ready single-page Certificate Generation Suite. Originally tailored for school medical organizations, this application has been fully generalized into an advanced certificate engine. 

Users can dynamically edit every text field, load custom e-signatures, upload unique institution badges, and watch the certificate's color palette automatically shift to match the branding of the uploaded logo in real-time!

---

## 🌟 Key Features & Architectures

### 1. Fully Generalized Content Customizer (`index.html` & `app.js`)
The editor dashboard is organized into three fluid glassmorphic tabs:
* **Content Tab**: Modify the institution/school name, department/organization name, certificate title, presentation subtitle phrase, recipient's name (with a dropdown of formal typography styles), and the primary & secondary citation descriptions.
* **Signatures Tab**: Dynamic inputs for two signatory columns (signee names and titles), date issued, location address, and auto/manual date sentence phrasing.
* **Aesthetics Tab (The "Feels")**: Manage background parchment paper materials, border types, corner ornaments, and distinct background watermark graphics.

### 2. Canvas-Based Dominant Color Extraction (`app.js`)
When a custom logo is uploaded, a lightweight pixel analysis engine runs inside the browser:
* The image is drawn onto a hidden canvas scaled to **`40x40` pixels** (built-in downscale averaging).
* Pixels are converted to HSL, skipping transparent, low-saturation greys, or extreme dark/light shades.
* Pixels are sorted into **36 distinct Hue buckets** representing 10-degree increments.
* The most frequent hue is selected as the **Primary Accent Color** (updating borders, headings, and primary accent lines).
* A contrasting, harmonious hue is calculated for the **Secondary Accent Color** (updating signature lines and highlights).
* Clicking **"Restore Default Logo"** instantly reverts the layout back to the custom medic crest badge and restores the default Sun Orange and Gold theme palette.

### 3. Dynamic E-Signatures
Signatories can upload custom signature files (transparent PNGs are recommended). 
* **Automatic Swap**: Fades out the handwritten calligraphic text preview placeholder and fades in your digital signature image directly above the sign line.
* **State Persistence**: Signatures are automatically encoded in Base64 and stored in local storage so details do not disappear on page refresh.

### 4. Advanced Parchment Materials & Borders (`style.css`)
Select from multiple background paper textures and outer border frames:
* **Textures**: *Premium Cream Parchment* (smooth warm glow), *Royal Off-White Linen* (fine textile cross-hatch fibers), and *Vintage Tan Fibers* (rough organic fibers).
* **Borders**: *Elegant Double Line* (gilded border), *Classic Solid Gold* (monochrome frame), *Thick Ornate Gilt* (heavy double orange border with gold shading), and *Clean / Borderless*.
* **Watermarks**: Independently toggle Faint Logo Watermark, Medical Heartbeat pulse line grid, and a neutral **Shield and Laurel Wreath Crest** watermark.

### 5. Pixel-Perfect A4 Landscape Print Projection
Clicking the **"Print / Save as PDF"** button triggers an isolated printing pipeline:
* It compiles a separate blank tab, copying the customized DOM markup and active color variables.
* Locks document dimensions strictly to physical **A4 Landscape sheet margins (`297mm x 210mm`)**.
* Automatically hides all controls, buttons, and scrollbars, enforcing a single-page output with zero blank overflow sheets.
* Delays the printing prompt by **800ms** to allow web fonts and base64 assets to render completely, ensuring a high-definition output.

---

## 📁 File Structure

* **`index.html`**: The main HTML structure, dashboard forms, and certificate layout wrapper.
* **`style.css`**: Premium CSS layout sheets containing paper textures, SVG watermark coordinates, typography selectors, theme variable mapping, and print-media parameters.
* **`app.js`**: Dynamic event binders, local storage loaders, HSL average color compilers, and window print writers.
* **`logo.png`**: The default medical badge asset (circular crest badge in warm orange and yellow-gold).
* **`sample_preview.png`**: A high-fidelity image render of the certificate for quick design previews.
* **`README.md`**: Project documentation guide.

---

## 🚀 How to Run & Print

### Local Execution (No Server Needed)
1. Navigate to the project directory: `c:\Users\johnm\Documents\SchoolMedicCertificate\`.
2. Double-click the **`index.html`** file. It will launch instantly in Chrome, Microsoft Edge, Firefox, or Safari.

### Generating Your Certificates
1. **Configure Content**: Open the **Content** and **Signatures** tabs to fill out your organization details, presentation phrasing, recipient names, signees, and date specifications.
2. **Select Styles**: Pick a calligraphy font, parchment background texture, and borders under the **Aesthetics** tab.
3. **Save/Print**: Click **"Print / Save as PDF"** to open the print tab.
4. **Browser Print Settings (Crucial)**:
   * **Destination**: Select *Save as PDF* or select your physical printer.
   * **Layout**: Enforce *Landscape* orientation.
   * **Background graphics**: Ensure this checkbox is **CHECKED** (otherwise the browser will ignore the parchment backgrounds, borders, and watermarks).
   * **Margins**: Set to *None* or *Default* (as the CSS locks the margins to zero).
