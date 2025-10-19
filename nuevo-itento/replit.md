# BiblioDigital - Biblioteca Digital Personal

## Overview
BiblioDigital is a personal digital library web application designed to allow users to manage, read, and organize their digital books. The project utilizes local storage mechanisms (localStorage and IndexedDB) to operate entirely without a backend or external database. It offers a rich user experience with features like book cataloging, personalized reading settings, and a responsive design. The vision is to provide a fully client-side, privacy-focused digital library solution that is easy to use and completely free from external service dependencies for its core functionality.

## Project Structure
```
BiblioDigital/
├── index.html              # Homepage
├── server.py               # Python HTTP server (port 5000)
├── README.md               # Project documentation
├── replit.md               # Project memory and changelog
├── css/                    # Stylesheets
│   └── styles.css          # Main styles
├── js/                     # JavaScript files
│   ├── app-localStorage.js # Local storage logic
│   ├── app-firebase.js     # Firebase integration (optional)
│   └── firebase-config.js  # Firebase configuration
├── pages/                  # Application pages
│   ├── catalog.html        # Book catalog
│   ├── favorites.html      # Favorite books
│   ├── fiction-reader.html # Fiction reader
│   ├── library.html        # User library
│   ├── login.html          # Login page
│   ├── reader.html         # PDF reader
│   └── settings.html       # Settings page
├── config/                 # Configuration files
│   ├── firebase.json       # Firebase config
│   ├── firestore.rules     # Firestore security rules
│   ├── firestore.indexes.json
│   └── storage.rules       # Storage security rules
└── books/                  # PDF storage (gitignored)
    └── *.pdf               # User uploaded books
```

## User Preferences
No explicit user preferences were provided in the original `replit.md` file.

## System Architecture

### UI/UX Decisions
-   **Responsive Design**: Fully adapted for mobile, tablets, and desktop with a professional and modern interface. This includes a collapsible sidebar on mobile and optimized layouts for various screen sizes and orientations.
-   **Theming**: 9 modern visual themes are available, each with a complete color palette, custom gradients, shadows, and adapted styles for all UI elements (sidebar, cards, modals, forms). Themes are designed for excellent contrast and perfect legibility across all text elements (page-title, section-title, labels, etc.).
-   **Authentication Flow**: Designed for optional local authentication. Users can explore content as guests without logging in, with login only required for uploading personal books.

### Technical Implementations
-   **Frontend**: Built using HTML5 for structure, CSS3 with variables for styling and responsive design, and Vanilla JavaScript for application logic.
-   **Book Management**:
    -   Catalog with search and category filters.
    -   Book uploads with custom covers (images converted to base64).
    -   Includes demo books and a favorites feature.
    -   Integrated reader with customizable font size and theme.
    -   **Fiction Express Reader**: New paginated reading experience (fiction-reader.html) that displays books page-by-page with navigation controls, progress tracking, and keyboard support. Uses JSON-formatted book data instead of PDFs.
-   **Local Authentication**:
    -   User registration and login handled via localStorage.
    -   User data stored locally in the browser; no external authentication server required.
-   **Customizable Settings**:
    -   User profile editing (name, email).
    -   Configurable visual themes, global font size, reader theme (Light, Dark, Sepia).
    -   Notification preferences and password change (for local authentication).

### System Design Choices
-   **Local Storage First**: The core design principle is to be fully client-side, using the browser's local storage capabilities.
    -   **localStorage**: Used for user data (authentication), book metadata (title, author, category, description), favorites, custom settings, and book covers (base64 images).
    -   **IndexedDB**: Employed for storing large binary files, specifically complete PDF files (up to 50MB per file). This overcomes the ~5MB limit of localStorage and is optimized for binary data, offering better performance and asynchronous operations. The database is `BiblioDigitalDB` with an object store `pdfs` where the key is `bookId` and the value is `pdfDataUrl` (base64 encoded PDF).
-   **Server**: A simple Python 3 `http.server` is used for serving static files during development, configured to run on `0.0.0.0:5000` (Replit compatible) with caching disabled for development.
-   **Security Considerations (Development)**: The project acknowledges that its local authentication and storage methods are for demonstration. For production, it strongly recommends implementing password hashing, real JWT-based authentication, HTTPS, input validation, and sanitization to prevent XSS.

## External Dependencies
-   **Python 3**: Used for the `http.server` module to serve static files.
-   **Firebase**: Configuration files (`firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`) are included for optional future deployment, indicating potential integration for cloud features like user data, book storage, and libraries. However, the core application functions without active Firebase integration, relying solely on local storage.

## Current Library Content
The application currently includes 3 books from the Warhammer 40,000 universe - "El Libro de Fuego" series by Nick Kyme:
1. **Salamandra** (El Libro de Fuego 1, 2009) - PDF stored in `/books/Salamandra.pdf`
2. **Draco de Fuego** (El Libro de Fuego 2, 2010) - PDF stored in `/books/Draco_de_fuego.pdf`
3. **Nocturne** (El Libro de Fuego 3, 2011) - PDF stored in `/books/Nocturne.pdf`

All PDFs are stored in the `/books/` directory (excluded from git via .gitignore).

## Recent Changes
### October 19, 2025 (Latest)
- ✅ **Project Reorganization** - Complete folder structure cleanup
  - **Folders created**: `css/`, `js/`, `pages/`, `config/`
  - **CSS files**: Moved `styles.css` → `css/`
  - **JavaScript**: Moved all `.js` files → `js/`
  - **HTML pages**: Moved all pages (except index.html) → `pages/`
  - **Config files**: Moved Firebase config files → `config/`
  - **Cleanup**: Removed unnecessary files (`setup.html`, `ADVANCED-READER.md`, `FIREBASE_SETUP.md`)
  - **References**: Updated all HTML file paths and script/style references
  - **Status**: All pages working correctly with new structure

### October 19, 2025 (Earlier)
- ✅ **Advanced Reader NOW DEFAULT** - The advanced reader is now the default reading experience
  - **Replaces**: `reader.html` is now the advanced reader (fully integrated with BiblioDigital)
  - **Integration**: Seamlessly loads books from catalog via localStorage
  - **IndexedDB Support**: Automatically loads PDFs stored in BiblioDigitalDB
  - **Fallback**: Shows friendly file selector if PDF not available locally
  - **Navigation**: Returns to catalog when clicking back button
  - **Format support**: PDF (via PDF.js) and EPUB (via epub.js)
  - **Annotations**: Highlighting text, adding notes/comments
  - **Visualization**: Zoom (50-200%), font size control, reading modes (light/sepia/dark)
  - **Text-only mode**: Enabled by default to hide distorted images in PDFs
  - **Persistent storage**: Progress and annotations saved in localStorage
  - **Keyboard shortcuts**: Arrow keys, h (highlight), n (note), +/- (zoom)
  - **Responsive design**: Works on mobile, tablet, and desktop
  - Files: `reader.html`, `css/advanced-reader.css`, `js/advanced-reader.js`

- ✅ **NEW: Fiction Express Reader** - Paginated book reader for JSON-formatted books
  - Clean interface with light background and serif typography
  - Page-by-page navigation with Previous/Next buttons
  - Reading progress indicator (page counter and percentage bar)
  - Keyboard navigation support (arrow keys)
  - Automatic progress saving using localStorage
  - Responsive design for all devices
  - Book selector to switch between available titles
  - Files: `fiction-reader.html`, `css/fiction-reader.css`, `js/fiction-reader.js`

- ✅ **File organization** - Restructured project into professional folder hierarchy
  - `css/` - All stylesheets
  - `js/` - All JavaScript files
  - `data/books/` - JSON-formatted books (3 books: demo, el-principito, salamandra)
  - `libs/` - Third-party libraries
  - `assets/` - Images and media resources

### October 2025 (Earlier)
- ✅ Removed all demo books (El Arte de la Programación, Cien Años de Soledad, Sapiens)
- ✅ Added 3 Warhammer 40K books with physical PDF files
- ✅ Created `/books/` folder for PDF storage
- ✅ Fixed homepage counter to display dynamic book count (now shows actual number of books)
- ✅ Updated .gitignore to exclude books folder
- ✅ Firebase configuration files created for future deployment
- ✅ Removed "Oscuro - Modo Nocturno" theme (8 themes now available)