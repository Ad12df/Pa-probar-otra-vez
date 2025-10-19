// ========== STATE MANAGEMENT ========== //
let booksData = [];
// currentUser will be managed by AuthService
let currentBooks = [];
let selectedBook = null;
let currentCategory = 'all';
let currentSearch = '';
let userSettings = {
    fontSize: 'medium',
    readerTheme: 'light',
    autoSave: true,
    emailNotifications: true,
    newBooks: false,
    readingReminders: true,
    appTheme: 'original',
    globalFontSize: 'medium'
};

// =================================================================
//                      REFACTORED AUTH SERVICE
// =================================================================
const AuthService = {
    currentUser: null,

    init() {
        // Load user from localStorage first for faster UI updates
        const savedUser = localStorage.getItem('biblioUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }

        auth.onAuthStateChanged(user => {
            if (user) {
                this.currentUser = {
                    uid: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email
                };
                localStorage.setItem('biblioUser', JSON.stringify(this.currentUser));
            } else {
                this.currentUser = null;
                localStorage.removeItem('biblioUser');
            }
            // These calls ensure the UI is always in sync with the auth state
            this.updateUserInfoUI();
            this.handlePageAuth();
        });
    },

    isAuthenticated() {
        return this.currentUser !== null;
    },

    handlePageAuth() {
        const path = window.location.pathname;
        const isAuthPage = path.includes('login.html');
        const isPublicPage = path.includes('index.html') || path === '/' || path.endsWith('/public/');

        if (isAuthPage && this.isAuthenticated()) {
            window.location.href = 'index.html';
        } else if (!isPublicPage && !isAuthPage && !this.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    },

    async signUp(name, email, password) {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update Firebase Auth profile
        await user.updateProfile({ displayName: name });

        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            favorites: []
        });

        // Manually update current user object after profile update
        this.currentUser = {
            uid: user.uid,
            name: user.displayName,
            email: user.email
        };
        localStorage.setItem('biblioUser', JSON.stringify(this.currentUser));

        return user;
    },

    async signIn(email, password) {
        await auth.signInWithEmailAndPassword(email, password);
    },

    async signOut() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            await auth.signOut();
            window.location.href = 'login.html';
        }
    },

    updateUserInfoUI() {
        if (!this.currentUser) return;

        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userInitials = document.getElementById('userInitials');

        if (userName) userName.textContent = this.currentUser.name;
        if (userEmail) userEmail.textContent = this.currentUser.email;
        if (userInitials) {
            const initials = (this.currentUser.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            userInitials.textContent = initials;
        }
    }
};

// ========== AUTH FORM SETUP (Refactored) ========== //
function setupAuthForm() {
    const authForm = document.getElementById('authForm');
    const toggleAuth = document.getElementById('toggleAuth');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const submitBtn = document.getElementById('submitBtn');
    const nameGroup = document.getElementById('nameGroup');
    const rememberGroup = document.getElementById('rememberGroup');
    const toggleText = document.getElementById('toggleText');

    let isSignUp = true; // Start in Sign Up mode for clarity

    const toggleMode = (e) => {
        if (e) e.preventDefault();
        isSignUp = !isSignUp;
        authForm.reset(); // Clear form on toggle

        if (isSignUp) {
            authTitle.textContent = 'Crear Cuenta';
            authSubtitle.textContent = 'Únete a nuestra comunidad de lectores';
            submitBtn.textContent = 'Crear Cuenta';
            nameGroup.style.display = 'flex';
            rememberGroup.style.display = 'none';
            toggleText.innerHTML = '¿Ya tienes cuenta? <a href="#" class="link-primary" id="toggleAuthLink">Iniciar Sesión</a>';
        } else {
            authTitle.textContent = 'Iniciar Sesión';
            authSubtitle.textContent = 'Bienvenido de vuelta a BiblioDigital';
            submitBtn.textContent = 'Iniciar Sesión';
            nameGroup.style.display = 'none';
            rememberGroup.style.display = 'flex';
            toggleText.innerHTML = '¿No tienes cuenta? <a href="#" class="link-primary" id="toggleAuthLink">Crear cuenta</a>';
        }
        // Re-attach listener to the new link
        document.getElementById('toggleAuthLink').addEventListener('click', toggleMode);
    };

    // Initial setup call
    toggleMode();

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        submitBtn.disabled = true;
        submitBtn.textContent = isSignUp ? 'Creando cuenta...' : 'Iniciando sesión...';

        try {
            if (isSignUp) {
                const name = document.getElementById('name').value;
                if (!name) {
                   throw new Error('El nombre es obligatorio.');
                }
                await AuthService.signUp(name, email, password);
            } else {
                await AuthService.signIn(email, password);
            }
            window.location.href = 'index.html';

        } catch (error) {
            console.error('Authentication Error:', error.code, error.message);
            let errorMessage = 'Error al autenticar. Por favor intenta de nuevo.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este correo electrónico ya está en uso.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Correo electrónico o contraseña incorrectos.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'El formato del correo electrónico no es válido.';
                    break;
                default:
                    errorMessage = error.message; // Use Firebase's default message if available
                    break;
            }
            alert(errorMessage);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión';
        }
    });
}
// ========== OLD AUTH FUNCTIONS (To be replaced) ========== //
// The old functions like initAuth, logout, updateUserInfo are now part of AuthService
// We keep a reference to logout for the button's onclick if needed, but it's better to add the event listener in JS
function logout() {
    AuthService.signOut();
}
// ========== FIRESTORE FUNCTIONS ========== //

async function loadBooksFromDB() {
    try {
        const snapshot = await db.collection('books').orderBy('createdAt', 'desc').get();
        booksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return booksData;
    } catch (error) {
        console.error('Error loading books:', error);
        booksData = [];
        return [];
    }
}

// ========== CATALOG FUNCTIONS ========== //

async function initCatalog() {
    await loadBooksFromDB();
    displayBooks(booksData);
    currentBooks = [...booksData];
    setupFilters();
    setupSearch();
    setupUploadButton();
}

function displayBooks(books) {
    const grid = document.getElementById('booksGrid');
    const noResults = document.getElementById('noResults');

    if (!grid) return;

    if (books.length === 0) {
        if (booksData.length === 0) {
            grid.innerHTML = `
                <div class="empty-catalog" style="grid-column: 1 / -1;">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 1.5rem; opacity: 0.3;">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <h3>Tu biblioteca está vacía</h3>
                    <p>Comienza subiendo tu primer libro haciendo clic en el botón "Subir Libro"</p>
                </div>
            `;
        } else {
            grid.innerHTML = '';
            if (noResults) noResults.style.display = 'flex';
        }
        return;
    }

    if (noResults) noResults.style.display = 'none';

    grid.innerHTML = books.map(book => `
        <div class="book-card" onclick="openBookModal('${book.id}')">
            <div class="book-cover">
                <img src="${book.coverUrl || 'https://via.placeholder.com/280x320?text=Sin+Portada'}" alt="${book.title}">
            </div>
            <div class="book-info">
                <span class="book-badge">${book.category}</span>
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">Por ${book.author}</p>
                <p class="book-description">${book.description.substring(0, 100)}...</p>
                <div class="book-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); quickRead('${book.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        Leer
                    </button>
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); openBookModal('${book.id}')">
                        Detalles
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentCategory = btn.dataset.category;
            filterBooks();
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            filterBooks();
        });
    }
}

async function filterBooks() {
    if (booksData.length === 0) {
        await loadBooksFromDB();
    }
    
    let filtered = booksData;

    if (currentCategory !== 'all') {
        filtered = filtered.filter(book => book.category === currentCategory);
    }

    if (currentSearch) {
        filtered = filtered.filter(book =>
            book.title.toLowerCase().includes(currentSearch) ||
            book.author.toLowerCase().includes(currentSearch) ||
            book.category.toLowerCase().includes(currentSearch) ||
            book.description.toLowerCase().includes(currentSearch)
        );
    }

    currentBooks = filtered;
    displayBooks(currentBooks);
}

// ========== UPLOAD FUNCTIONS ========== //

function setupUploadButton() {
    const uploadBtn = document.getElementById('uploadBookBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            if (!AuthService.isAuthenticated()) {
                alert('Debes iniciar sesión para subir un libro');
                window.location.href = 'login.html';
                return;
            }
            openUploadModal();
        });
    }
}

function openUploadModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'uploadModal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeUploadModal()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeUploadModal()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="modal-body" style="padding: 2rem;">
                <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 1.5rem;">Subir Nuevo Libro</h2>
                <form id="uploadForm" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div class="form-group">
                        <label class="form-label">Título</label>
                        <input type="text" name="title" required class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Autor</label_>
                        <input type="text" name="author" required class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoría</label>
                        <select name="category" required class="form-select">
                            <option value="">Selecciona una categoría</option>
                            <option value="Ficción">Ficción</option>
                            <option value="No Ficción">No Ficción</option>
                            <option value="Ciencia">Ciencia</option>
                            <option value="Tecnología">Tecnología</option>
                            <option value="Historia">Historia</option>
                            <option value="Biografía">Biografía</option>
                            <option value="Educación">Educación</option>
                            <option value="Arte">Arte</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descripción</label>
                        <textarea name="description" required class="form-input" rows="4"></textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Páginas</label>
                            <input type="number" name="pages" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Año</label>
                            <input type="number" name="year" class="form-input">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Portada (Imagen)</label_>
                        <input type="file" name="cover" accept="image/*" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Archivo PDF</label_>
                        <input type="file" name="pdf" accept=".pdf" class="form-input">
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Subir Libro</button>
                        <button type="button" class="btn btn-secondary" onclick="closeUploadModal()">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    document.getElementById('uploadForm').addEventListener('submit', handleUploadSubmit);
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

async function handleUploadSubmit(e) {
    e.preventDefault();
    
    if (!AuthService.isAuthenticated()) {
        alert('Debes iniciar sesión para subir un libro');
        window.location.href = 'login.html';
        return;
    }
    
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subiendo...';

    try {
        const coverFile = formData.get('cover');
        const pdfFile = formData.get('pdf');
        let coverUrl = '';
        let pdfUrl = '';

        if (coverFile && coverFile.size > 0) {
            const coverRef = storage.ref(`covers/${Date.now()}_${coverFile.name}`);
            const coverSnapshot = await coverRef.put(coverFile);
            coverUrl = await coverSnapshot.ref.getDownloadURL();
        }

        if (pdfFile && pdfFile.size > 0) {
            const pdfRef = storage.ref(`pdfs/${Date.now()}_${pdfFile.name}`);
            const pdfSnapshot = await pdfRef.put(pdfFile);
            pdfUrl = await pdfSnapshot.ref.getDownloadURL();
        }

        await db.collection('books').add({
            title: formData.get('title'),
            author: formData.get('author'),
            category: formData.get('category'),
            description: formData.get('description'),
            pages: parseInt(formData.get('pages')) || 0,
            year: parseInt(formData.get('year')) || new Date().getFullYear(),
            coverUrl: coverUrl,
            pdfUrl: pdfUrl,
            uploadedBy: AuthService.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('¡Libro subido exitosamente!');
        closeUploadModal();
        await loadBooksFromDB();
        displayBooks(booksData);
    } catch (error) {
        console.error('Error al subir libro:', error);
        alert('Error al subir el libro: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subir Libro';
    }
}


// ========== MODAL FUNCTIONS ========== //

function openBookModal(bookId) {
    selectedBook = booksData.find(book => book.id === bookId);
    
    if (!selectedBook) return;

    const modal = document.getElementById('bookModal');
    if (!modal) return;

    document.getElementById('modalCover').src = selectedBook.coverUrl || 'https://via.placeholder.com/300x400?text=Sin+Portada';
    document.getElementById('modalTitle').textContent = selectedBook.title;
    document.getElementById('modalAuthor').textContent = `Por ${selectedBook.author}`;
    document.getElementById('modalDescription').textContent = selectedBook.description;
    document.getElementById('modalCategory').textContent = selectedBook.category;
    document.getElementById('modalPages').textContent = selectedBook.pages || 'N/A';
    document.getElementById('modalYear').textContent = selectedBook.year || 'N/A';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('bookModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function startReading() {
    if (!selectedBook) return;
    localStorage.setItem('currentBook', JSON.stringify(selectedBook));
    window.location.href = 'reader.html';
}

function quickRead(bookId) {
    const book = booksData.find(b => b.id === bookId);
    if (!book) return;
    localStorage.setItem('currentBook', JSON.stringify(book));
    window.location.href = 'reader.html';
}

async function addToFavorites() {
    if (!selectedBook) return;
    
    if (!AuthService.isAuthenticated()) {
        alert('Debes iniciar sesión para agregar favoritos');
        return;
    }
    
    try {
        const userDoc = db.collection('users').doc(AuthService.currentUser.uid);
        await userDoc.update({
            favorites: firebase.firestore.FieldValue.arrayUnion(selectedBook.id)
        });
        alert('¡Libro agregado a favoritos!');
    } catch (error) {
        if (error.code === 'not-found') {
             // If the document doesn't exist, create it.
            await db.collection('users').doc(AuthService.currentUser.uid).set({
                favorites: [selectedBook.id]
            }, { merge: true });
            alert('¡Libro agregado a favoritos!');
        } else {
            console.error('Error al agregar favorito:', error);
            alert('Este libro ya está en tus favoritos.');
        }
    }
}

async function removeFromFavorites() {
    if (!selectedBook || !AuthService.isAuthenticated()) return;
    
    try {
        const userDoc = db.collection('users').doc(AuthService.currentUser.uid);
        await userDoc.update({
            favorites: firebase.firestore.FieldValue.arrayRemove(selectedBook.id)
        });
        alert('Libro removido de favoritos');
        closeModal();
        
        if (window.location.pathname.includes('favorites.html')) {
            initFavorites();
        }
    } catch (error) {
        console.error('Error al remover favorito:', error);
        alert('Error al remover de favoritos');
    }
}

// ========== READER FUNCTIONS ========== //

async function initReader() {
    const currentBookData = localStorage.getItem('currentBook');
    if (!currentBookData) {
        window.location.href = 'catalog.html';
        return;
    }
    const book = JSON.parse(currentBookData);
    //... rest of the function
}

// ... (rest of the file remains the same)
// ========== SETTINGS FUNCTIONS ========== //

function initSettings() {
    loadSettings();
    setupSettingsForms();
    populateSettingsFields();
    applyVisualSettings();
}

function loadSettings() {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
        userSettings = { ...userSettings, ...JSON.parse(saved) };
    }
}

function saveSettings() {
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
}

function populateSettingsFields() {
    if (!AuthService.currentUser) return;
    const user = AuthService.currentUser;

    // ... (populate fields with user and userSettings)
}

// ... etc. The rest of your functions should be updated to use `AuthService.currentUser` and `AuthService.isAuthenticated()`


// ========== INITIALIZATION ========== //
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    applyVisualSettings();
    AuthService.init(); // <-- Initialize the new service

    const path = window.location.pathname;

    if (path.includes('login.html')) {
        setupAuthForm(); // Setup form only on login page
    }
    
    // Add logout listener if button exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => AuthService.signOut());
    }

    if (path.includes('index.html') || path === '/' || path.endsWith('/public/')) {
        initHome();
    } else if (path.includes('catalog.html')) {
        initCatalog();
    } else if (path.includes('favorites.html')) {
        initFavorites();
    } else if (path.includes('reader.html')) {
        initReader();
    } else if (path.includes('settings.html')) {
        initSettings();
    }
});
