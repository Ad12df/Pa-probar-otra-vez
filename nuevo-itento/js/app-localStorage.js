// ========== BIBLIODIGITAL - LOCAL STORAGE VERSION ========== //
// Sistema completo usando localStorage para almacenamiento de datos

// ========== STATE MANAGEMENT ========== //
let booksData = [];
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

// ========== LOCAL STORAGE KEYS ========== //
const STORAGE_KEYS = {
    USER: 'biblioUser',
    BOOKS: 'biblioBooks',
    SETTINGS: 'userSettings',
    FAVORITES: 'biblioFavorites'
};

// ========== INDEXEDDB SETUP FOR PDFS ========== //
let db = null;

function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BiblioDigitalDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains('pdfs')) {
                database.createObjectStore('pdfs', { keyPath: 'bookId' });
            }
        };
    });
}

function savePDFToIndexedDB(bookId, pdfDataUrl) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction(['pdfs'], 'readwrite');
        const store = transaction.objectStore('pdfs');
        const request = store.put({ bookId: bookId, pdfData: pdfDataUrl });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function getPDFFromIndexedDB(bookId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction(['pdfs'], 'readonly');
        const store = transaction.objectStore('pdfs');
        const request = store.get(bookId);
        
        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result.pdfData);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

function deletePDFFromIndexedDB(bookId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction(['pdfs'], 'readwrite');
        const store = transaction.objectStore('pdfs');
        const request = store.delete(bookId);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ========== AUTH SERVICE (LocalStorage Version) ========== //
const AuthService = {
    currentUser: null,

    init() {
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
        this.updateUserInfoUI();
        this.handlePageAuth();
    },

    isAuthenticated() {
        return this.currentUser !== null;
    },

    handlePageAuth() {
        const path = window.location.pathname;
        const isAuthPage = path.includes('login.html');

        // Si estás en login y ya estás autenticado, redirigir a inicio
        if (isAuthPage && this.isAuthenticated()) {
            window.location.href = 'index.html';
        }
        // Permitir acceso libre a todas las demás páginas
    },

    signUp(name, email, password) {
        const uid = 'user_' + Date.now();
        const user = {
            uid: uid,
            name: name,
            email: email,
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        localStorage.setItem('userPassword', password); // Solo para demo
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([]));
        
        this.currentUser = user;
        return user;
    },

    signIn(email, password) {
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const savedPassword = localStorage.getItem('userPassword');
        
        if (!savedUser) {
            throw new Error('Usuario no encontrado. Por favor regístrate primero.');
        }
        
        const user = JSON.parse(savedUser);
        if (user.email !== email) {
            throw new Error('Correo electrónico incorrecto.');
        }
        
        if (savedPassword !== password) {
            throw new Error('Contraseña incorrecta.');
        }
        
        this.currentUser = user;
        return user;
    },

    signOut() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            this.currentUser = null;
            localStorage.removeItem(STORAGE_KEYS.USER);
            window.location.href = 'login.html';
        }
    },

    updateUserInfoUI() {
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userInitials = document.getElementById('userInitials');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const logoutBtn = document.getElementById('logoutBtn');
        const sidebarFooter = document.querySelector('.sidebar-footer');

        if (this.currentUser) {
            if (userName) userName.textContent = this.currentUser.name;
            if (userEmail) userEmail.textContent = this.currentUser.email;
            if (profileName) profileName.value = this.currentUser.name;
            if (profileEmail) profileEmail.value = this.currentUser.email;
            if (userInitials) {
                const initials = (this.currentUser.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                userInitials.textContent = initials || 'U';
            }
            
            if (sidebarFooter && !document.querySelector('.user-profile')) {
                const userProfile = document.createElement('div');
                userProfile.className = 'user-profile';
                userProfile.innerHTML = `
                    <div class="user-avatar">
                        <span id="userInitials">U</span>
                    </div>
                    <div class="user-info">
                        <p class="user-name" id="userName">${this.currentUser.name}</p>
                        <p class="user-email" id="userEmail">${this.currentUser.email}</p>
                    </div>
                `;
                sidebarFooter.insertBefore(userProfile, logoutBtn);
            }
            
            if (logoutBtn) {
                logoutBtn.style.display = 'flex';
                logoutBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Cerrar sesión
                `;
                logoutBtn.onclick = () => AuthService.signOut();
            }
        } else {
            if (userName) userName.textContent = 'Invitado';
            if (userEmail) userEmail.textContent = 'No has iniciado sesión';
            if (userInitials) userInitials.textContent = 'I';
            
            if (logoutBtn) {
                logoutBtn.style.display = 'flex';
                logoutBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                        <polyline points="10 17 15 12 10 7"></polyline>
                        <line x1="15" y1="12" x2="3" y2="12"></line>
                    </svg>
                    Iniciar sesión
                `;
                logoutBtn.onclick = () => {
                    window.location.href = 'login.html';
                };
            }
        }
    },

    updateProfile(name, email) {
        if (!this.currentUser) return;
        
        this.currentUser.name = name;
        this.currentUser.email = email;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
        this.updateUserInfoUI();
    }
};

// ========== AUTH FORM SETUP ========== //
function setupAuthForm() {
    const authForm = document.getElementById('authForm');
    const toggleAuth = document.getElementById('toggleAuth');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const submitBtn = document.getElementById('submitBtn');
    const nameGroup = document.getElementById('nameGroup');
    const rememberGroup = document.getElementById('rememberGroup');
    const toggleText = document.getElementById('toggleText');

    let isSignUp = true;

    const toggleMode = (e) => {
        if (e) e.preventDefault();
        isSignUp = !isSignUp;
        authForm.reset();

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
        document.getElementById('toggleAuthLink').addEventListener('click', toggleMode);
    };

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
                if (!name) throw new Error('El nombre es obligatorio.');
                AuthService.signUp(name, email, password);
            } else {
                AuthService.signIn(email, password);
            }
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Authentication Error:', error);
            alert(error.message || 'Error al autenticar. Por favor intenta de nuevo.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión';
        }
    });
}

// ========== BOOKS DATA MANAGEMENT ========== //
function loadBooksFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKS);
    if (saved) {
        booksData = JSON.parse(saved);
    } else {
        // Libros iniciales de la biblioteca
        booksData = [
            {
                id: 'book_nocturne',
                title: 'Nocturne',
                author: 'Nick Kyme',
                category: 'Ciencia Ficción',
                description: 'La guerra ha llegado a Nocturne. Tras décadas de planificación y masacres, Nihilan ha reunido a una inmensa flota de Guerreros Dragón, Eldars Oscuros y Renegados del Caos. En nombre de la venganza lanza su ataque. El Libro de Fuego 3.',
                pages: 450,
                year: 2011,
                coverUrl: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop',
                pdfUrl: 'books/Nocturne.pdf',
                hasPDF: true,
                uploadedBy: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 'book_draco',
                title: 'Draco de Fuego',
                author: 'Nick Kyme',
                category: 'Ciencia Ficción',
                description: 'El capellán Elysius de los Salamandra ha sido apresado por los eldars oscuros y los Dracos de Fuego de la 1ª Compañía planean una audaz misión de rescate. Warhammer 40000 - El Libro de Fuego 2.',
                pages: 380,
                year: 2010,
                coverUrl: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400&h=600&fit=crop',
                pdfUrl: 'books/Draco_de_fuego.pdf',
                hasPDF: true,
                uploadedBy: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 'book_salamandra',
                title: 'Salamandra',
                author: 'Nick Kyme',
                category: 'Ciencia Ficción',
                description: 'Los Marines Espaciales del capítulo Salamandra se dirigen, guiados por una antigua profecía, a un planeta plagado de misterios. Warhammer 40000 - El Libro de Fuego 1.',
                pages: 420,
                year: 2009,
                coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=600&fit=crop',
                pdfUrl: 'books/Salamandra.pdf',
                hasPDF: true,
                uploadedBy: 'admin',
                createdAt: new Date().toISOString()
            }
        ];
        saveBooksToStorage();
    }
    return booksData;
}

function saveBooksToStorage() {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(booksData));
}

function addBook(bookData, bookId = null) {
    const newBook = {
        id: bookId || 'book_' + Date.now(),
        ...bookData,
        uploadedBy: AuthService.currentUser?.uid || 'anonymous',
        createdAt: new Date().toISOString()
    };
    booksData.unshift(newBook);
    saveBooksToStorage();
    return newBook;
}

function updateBook(bookId, updatedData) {
    const index = booksData.findIndex(book => book.id === bookId);
    if (index !== -1) {
        booksData[index] = { ...booksData[index], ...updatedData };
        saveBooksToStorage();
        return booksData[index];
    }
    return null;
}

async function deleteBook(bookId) {
    const index = booksData.findIndex(book => book.id === bookId);
    if (index !== -1) {
        const book = booksData[index];
        if (book.hasPDF) {
            try {
                await deletePDFFromIndexedDB(bookId);
            } catch (error) {
                console.error('Error deleting PDF from IndexedDB:', error);
            }
        }
        booksData.splice(index, 1);
        saveBooksToStorage();
        return true;
    }
    return false;
}

function getUserBooks() {
    if (!AuthService.isAuthenticated()) return [];
    return booksData.filter(book => book.uploadedBy === AuthService.currentUser.uid);
}

function getAllBooks() {
    return booksData;
}

// ========== FAVORITES MANAGEMENT ========== //
function getFavorites() {
    const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return saved ? JSON.parse(saved) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
}

function addToFavorites() {
    if (!selectedBook) return;
    
    if (!AuthService.isAuthenticated()) {
        alert('Debes iniciar sesión para agregar favoritos');
        return;
    }
    
    const favorites = getFavorites();
    if (favorites.includes(selectedBook.id)) {
        alert('Este libro ya está en tus favoritos.');
        return;
    }
    
    favorites.push(selectedBook.id);
    saveFavorites(favorites);
    alert('¡Libro agregado a favoritos!');
}

function removeFromFavorites() {
    if (!selectedBook || !AuthService.isAuthenticated()) return;
    
    const favorites = getFavorites();
    const index = favorites.indexOf(selectedBook.id);
    if (index > -1) {
        favorites.splice(index, 1);
        saveFavorites(favorites);
        alert('Libro removido de favoritos');
        closeModal();
        
        if (window.location.pathname.includes('favorites.html')) {
            initFavorites();
        }
    }
}

// ========== CATALOG FUNCTIONS ========== //
function initCatalog() {
    loadBooksFromStorage();
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

function filterBooks() {
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
        // Actualizar el texto del botón según el estado de autenticación
        if (AuthService.isAuthenticated()) {
            uploadBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Subir Libro
            `;
        } else {
            uploadBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Inicia sesión para subir
            `;
        }
        
        uploadBtn.addEventListener('click', () => {
            if (!AuthService.isAuthenticated()) {
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
        <div class="modal-content" style="max-width: 800px;">
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
                        <label class="form-label">Título *</label>
                        <input type="text" name="title" required class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Autor *</label>
                        <input type="text" name="author" required class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoría *</label>
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
                        <label class="form-label">Descripción *</label>
                        <textarea name="description" required class="form-input" rows="4"></textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Páginas</label>
                            <input type="number" name="pages" class="form-input" value="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Año</label>
                            <input type="number" name="year" class="form-input" value="${new Date().getFullYear()}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Portada (imagen) *</label>
                        <input type="file" name="cover" id="coverFileInput" accept="image/*" class="form-input" required>
                        <p class="form-hint">Sube una imagen de portada (JPG, PNG, etc.)</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Archivo PDF *</label>
                        <input type="file" name="pdf" id="pdfFileInput" accept="application/pdf" class="form-input" required>
                        <p class="form-hint">Sube el archivo PDF del libro (máx. 50MB)</p>
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
    
    const coverFile = formData.get('cover');
    const pdfFile = formData.get('pdf');
    
    if (!coverFile || coverFile.size === 0) {
        alert('Debes seleccionar una imagen de portada');
        return;
    }
    
    if (!pdfFile || pdfFile.size === 0) {
        alert('Debes seleccionar un archivo PDF');
        return;
    }
    
    if (pdfFile.size > 50 * 1024 * 1024) {
        alert('El archivo PDF es demasiado grande. Máximo 50MB');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subiendo...';

    try {
        const coverDataUrl = await readFileAsDataURL(coverFile);
        const pdfDataUrl = await readFileAsDataURL(pdfFile);
        
        const bookId = 'book_' + Date.now();
        
        const bookData = {
            title: formData.get('title'),
            author: formData.get('author'),
            category: formData.get('category'),
            description: formData.get('description'),
            pages: parseInt(formData.get('pages')) || 0,
            year: parseInt(formData.get('year')) || new Date().getFullYear(),
            coverUrl: coverDataUrl,
            pdfUrl: '',
            hasPDF: true,
            content: 'PDF: ' + pdfFile.name
        };
        
        const newBook = addBook(bookData, bookId);
        
        await savePDFToIndexedDB(newBook.id, pdfDataUrl);
        
        alert('¡Libro subido exitosamente!');
        closeUploadModal();
        loadBooksFromStorage();
        displayBooks(booksData);
    } catch (error) {
        console.error('Error uploading book:', error);
        alert('Error al subir el libro: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subir Libro';
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Error reading file'));
        reader.readAsDataURL(file);
    });
}

// ========== EDIT & DELETE FUNCTIONS ========== //
function openEditModal(bookId) {
    const book = booksData.find(b => b.id === bookId);
    if (!book) return;
    
    if (book.uploadedBy !== AuthService.currentUser?.uid) {
        alert('Solo puedes editar tus propios libros');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'editModal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeEditModal()"></div>
        <div class="modal-content" style="max-width: 800px;">
            <button class="modal-close" onclick="closeEditModal()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="modal-body" style="padding: 2rem;">
                <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 1.5rem;">Editar Libro</h2>
                <form id="editForm" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div class="form-group">
                        <label class="form-label">Título *</label>
                        <input type="text" name="title" value="${book.title}" required class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Autor *</label>
                        <input type="text" name="author" value="${book.author}" required class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoría *</label>
                        <select name="category" required class="form-select">
                            <option value="Ficción" ${book.category === 'Ficción' ? 'selected' : ''}>Ficción</option>
                            <option value="No Ficción" ${book.category === 'No Ficción' ? 'selected' : ''}>No Ficción</option>
                            <option value="Ciencia" ${book.category === 'Ciencia' ? 'selected' : ''}>Ciencia</option>
                            <option value="Tecnología" ${book.category === 'Tecnología' ? 'selected' : ''}>Tecnología</option>
                            <option value="Historia" ${book.category === 'Historia' ? 'selected' : ''}>Historia</option>
                            <option value="Biografía" ${book.category === 'Biografía' ? 'selected' : ''}>Biografía</option>
                            <option value="Educación" ${book.category === 'Educación' ? 'selected' : ''}>Educación</option>
                            <option value="Arte" ${book.category === 'Arte' ? 'selected' : ''}>Arte</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descripción *</label>
                        <textarea name="description" required class="form-input" rows="4">${book.description}</textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Páginas</label>
                            <input type="number" name="pages" value="${book.pages || 0}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Año</label>
                            <input type="number" name="year" value="${book.year || new Date().getFullYear()}" class="form-input">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cambiar portada (opcional)</label>
                        <input type="file" name="cover" id="editCoverFile" accept="image/*" class="form-input">
                        <p class="form-hint">Deja en blanco para mantener la portada actual</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cambiar PDF (opcional)</label>
                        <input type="file" name="pdf" id="editPdfFile" accept="application/pdf" class="form-input">
                        <p class="form-hint">Deja en blanco para mantener el PDF actual</p>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Guardar Cambios</button>
                        <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    document.getElementById('editForm').addEventListener('submit', (e) => handleEditSubmit(e, bookId));
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

async function handleEditSubmit(e, bookId) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    const coverFile = formData.get('cover');
    const pdfFile = formData.get('pdf');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    const book = booksData.find(b => b.id === bookId);
    if (!book) return;

    try {
        const updateData = {
            title: formData.get('title'),
            author: formData.get('author'),
            category: formData.get('category'),
            description: formData.get('description'),
            pages: parseInt(formData.get('pages')) || 0,
            year: parseInt(formData.get('year')) || new Date().getFullYear()
        };

        if (coverFile && coverFile.size > 0) {
            updateData.coverUrl = await readFileAsDataURL(coverFile);
        }
        
        if (pdfFile && pdfFile.size > 0) {
            if (pdfFile.size > 50 * 1024 * 1024) {
                alert('El archivo PDF es demasiado grande. Máximo 50MB');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Cambios';
                return;
            }
            const pdfDataUrl = await readFileAsDataURL(pdfFile);
            await savePDFToIndexedDB(bookId, pdfDataUrl);
            updateData.hasPDF = true;
            updateData.content = 'PDF: ' + pdfFile.name;
        }

        updateBook(bookId, updateData);
        alert('¡Libro actualizado exitosamente!');
        closeEditModal();
        loadBooksFromStorage();
        displayBooks(booksData);
    } catch (error) {
        console.error('Error updating book:', error);
        alert('Error al actualizar el libro: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Cambios';
    }
}

async function confirmDeleteBook(bookId) {
    const book = booksData.find(b => b.id === bookId);
    if (!book) return;
    
    if (book.uploadedBy !== AuthService.currentUser?.uid) {
        alert('Solo puedes eliminar tus propios libros');
        return;
    }
    
    if (confirm(`¿Estás seguro de que quieres eliminar "${book.title}"? Esta acción no se puede deshacer.`)) {
        await deleteBook(bookId);
        alert('Libro eliminado exitosamente');
        closeModal();
        loadBooksFromStorage();
        displayBooks(booksData);
    }
}

// ========== MODAL FUNCTIONS ========== //
function openBookModal(bookId) {
    selectedBook = booksData.find(book => book.id === bookId);
    
    if (!selectedBook) return;

    const modal = document.getElementById('bookModal');
    if (!modal) return;

    const isOwner = AuthService.isAuthenticated() && selectedBook.uploadedBy === AuthService.currentUser.uid;

    document.getElementById('modalCover').src = selectedBook.coverUrl || 'https://via.placeholder.com/300x400?text=Sin+Portada';
    document.getElementById('modalTitle').textContent = selectedBook.title;
    document.getElementById('modalAuthor').textContent = `Por ${selectedBook.author}`;
    document.getElementById('modalDescription').textContent = selectedBook.description;
    document.getElementById('modalCategory').textContent = selectedBook.category;
    document.getElementById('modalPages').textContent = selectedBook.pages || 'N/A';
    document.getElementById('modalYear').textContent = selectedBook.year || 'N/A';

    const modalActions = modal.querySelector('.modal-actions');
    if (modalActions) {
        modalActions.innerHTML = `
            <button class="btn btn-primary" onclick="startReading()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                Leer Ahora
            </button>
            <button class="btn btn-secondary" onclick="addToFavorites()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Favoritos
            </button>
            ${isOwner ? `
                <button class="btn btn-secondary" onclick="openEditModal('${selectedBook.id}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Editar
                </button>
                <button class="btn btn-danger" onclick="confirmDeleteBook('${selectedBook.id}')" style="background: #dc2626;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Eliminar
                </button>
            ` : ''}
        `;
    }

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

// ========== HOME FUNCTIONS ========== //
function initHome() {
    loadBooksFromStorage();
    updateBookCount();
    displaySuggestedBooks();
}

function updateBookCount() {
    const countElement = document.getElementById('totalBooksCount');
    if (countElement) {
        countElement.textContent = booksData.length;
    }
}

function displaySuggestedBooks() {
    const grid = document.getElementById('suggestedBooksGrid');
    if (!grid) return;

    const suggested = booksData.slice(0, 6);
    
    grid.innerHTML = suggested.map(book => `
        <div class="book-card-compact" onclick="quickRead('${book.id}')">
            <img src="${book.coverUrl || 'https://via.placeholder.com/200x280?text=Sin+Portada'}" alt="${book.title}">
            <div class="book-card-compact-info">
                <h4>${book.title}</h4>
                <p>${book.author}</p>
            </div>
        </div>
    `).join('');
}

// ========== FAVORITES FUNCTIONS ========== //
function initFavorites() {
    loadBooksFromStorage();
    const favorites = getFavorites();
    const favoriteBooks = booksData.filter(book => favorites.includes(book.id));
    displayBooks(favoriteBooks);
}

// ========== MY LIBRARY FUNCTIONS ========== //
function initLibrary() {
    loadBooksFromStorage();
    const userBooks = getUserBooks();
    displayBooks(userBooks);
    setupUploadButton();
}

// ========== READER FUNCTIONS ========== //
async function initReader() {
    const currentBookData = localStorage.getItem('currentBook');
    if (!currentBookData) {
        window.location.href = 'catalog.html';
        return;
    }
    
    const book = JSON.parse(currentBookData);
    const readerTitle = document.getElementById('readerTitle');
    const readerContent = document.getElementById('readerContent');
    
    if (readerTitle) {
        readerTitle.textContent = book.title;
    }
    
    if (readerContent) {
        if (book.hasPDF) {
            try {
                const pdfDataUrl = await getPDFFromIndexedDB(book.id);
                if (pdfDataUrl && pdfDataUrl.startsWith('data:application/pdf')) {
                    readerContent.innerHTML = `
                        <div class="pdf-reader-container" style="width: 100%; height: 100vh;">
                            <div style="background: var(--gray-100); padding: 1rem; border-bottom: 1px solid var(--gray-300);">
                                <h2 style="margin: 0; font-size: 1.5rem; color: var(--gray-900);">${book.title}</h2>
                                <p style="margin: 0.5rem 0 0; color: var(--gray-600);">Por ${book.author}</p>
                            </div>
                            <iframe src="${pdfDataUrl}" style="width: 100%; height: calc(100vh - 120px); border: none;" title="${book.title}"></iframe>
                        </div>
                    `;
                } else {
                    readerContent.innerHTML = `
                        <div class="reader-text">
                            <h1>${book.title}</h1>
                            <h2>Por ${book.author}</h2>
                            <p style="color: var(--red-600); padding: 2rem;">Error: No se pudo cargar el PDF. El archivo podría estar corrupto.</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error loading PDF:', error);
                readerContent.innerHTML = `
                    <div class="reader-text">
                        <h1>${book.title}</h1>
                        <h2>Por ${book.author}</h2>
                        <p style="color: var(--red-600); padding: 2rem;">Error al cargar el PDF: ${error.message}</p>
                    </div>
                `;
            }
        } else {
            readerContent.innerHTML = `
                <div class="reader-text">
                    <h1>${book.title}</h1>
                    <h2>Por ${book.author}</h2>
                    <div class="reader-content-text">
                        ${book.content ? book.content.split('\n').map(p => `<p>${p}</p>`).join('') : '<p>Contenido del libro no disponible.</p>'}
                    </div>
                </div>
            `;
            loadSettings();
            applyReaderSettings();
        }
    }
    
    // Simular progreso de lectura
    window.addEventListener('scroll', updateReadingProgress);
}

function updateReadingProgress() {
    const content = document.querySelector('.reader-content');
    const progressBar = document.getElementById('readingProgress');
    const progressText = document.getElementById('progressPercentage');
    
    if (!content || !progressBar) return;
    
    const scrolled = window.scrollY;
    const height = content.scrollHeight - window.innerHeight;
    const progress = Math.min((scrolled / height) * 100, 100);
    
    progressBar.style.width = progress + '%';
    if (progressText) progressText.textContent = Math.round(progress) + '%';
}

function increaseFontSize() {
    const sizes = ['small', 'medium', 'large', 'xlarge'];
    const current = userSettings.fontSize;
    const index = sizes.indexOf(current);
    if (index < sizes.length - 1) {
        userSettings.fontSize = sizes[index + 1];
        saveSettings();
        applyReaderSettings();
    }
}

function decreaseFontSize() {
    const sizes = ['small', 'medium', 'large', 'xlarge'];
    const current = userSettings.fontSize;
    const index = sizes.indexOf(current);
    if (index > 0) {
        userSettings.fontSize = sizes[index - 1];
        saveSettings();
        applyReaderSettings();
    }
}

function toggleTheme() {
    const themes = ['light', 'dark', 'sepia'];
    const current = userSettings.readerTheme;
    const index = themes.indexOf(current);
    const nextIndex = (index + 1) % themes.length;
    userSettings.readerTheme = themes[nextIndex];
    saveSettings();
    applyReaderSettings();
}

function applyReaderSettings() {
    const content = document.querySelector('.reader-text');
    if (!content) return;
    
    const fontSizes = { small: '14px', medium: '18px', large: '22px', xlarge: '26px' };
    content.style.fontSize = fontSizes[userSettings.fontSize] || '18px';
    
    const themes = {
        light: { bg: '#ffffff', color: '#1f2937' },
        dark: { bg: '#1f2937', color: '#f9fafb' },
        sepia: { bg: '#f4ecd8', color: '#5c4a3a' }
    };
    
    const theme = themes[userSettings.readerTheme] || themes.light;
    content.style.backgroundColor = theme.bg;
    content.style.color = theme.color;
}

// ========== SETTINGS FUNCTIONS ========== //
function initSettings() {
    loadSettings();
    setupSettingsForms();
    populateSettingsFields();
    applyVisualSettings();
}

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
        userSettings = { ...userSettings, ...JSON.parse(saved) };
    }
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(userSettings));
}

function populateSettingsFields() {
    if (AuthService.currentUser) {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        if (profileName) profileName.value = AuthService.currentUser.name;
        if (profileEmail) profileEmail.value = AuthService.currentUser.email;
    }
    
    // Visual settings
    const appTheme = document.getElementById('appTheme');
    const fontSize = document.getElementById('fontSize');
    const readerTheme = document.getElementById('readerTheme');
    const globalFontSize = document.getElementById('globalFontSize');
    const autoSave = document.getElementById('autoSave');
    
    if (appTheme) appTheme.value = userSettings.appTheme || 'original';
    if (fontSize) fontSize.value = userSettings.fontSize || 'medium';
    if (readerTheme) readerTheme.value = userSettings.readerTheme || 'light';
    if (globalFontSize) globalFontSize.value = userSettings.globalFontSize || 'medium';
    if (autoSave) autoSave.checked = userSettings.autoSave !== false;
    
    // Notifications
    const emailNotifications = document.getElementById('emailNotifications');
    const newBooks = document.getElementById('newBooks');
    const readingReminders = document.getElementById('readingReminders');
    
    if (emailNotifications) emailNotifications.checked = userSettings.emailNotifications !== false;
    if (newBooks) newBooks.checked = userSettings.newBooks === true;
    if (readingReminders) readingReminders.checked = userSettings.readingReminders !== false;
}

function setupSettingsForms() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('profileName').value;
            const email = document.getElementById('profileEmail').value;
            AuthService.updateProfile(name, email);
            alert('✅ Perfil actualizado correctamente');
        });
    }
    
    // Visual form
    const visualForm = document.getElementById('visualForm');
    if (visualForm) {
        visualForm.addEventListener('submit', (e) => {
            e.preventDefault();
            userSettings.appTheme = document.getElementById('appTheme').value;
            userSettings.fontSize = document.getElementById('fontSize').value;
            userSettings.readerTheme = document.getElementById('readerTheme').value;
            userSettings.globalFontSize = document.getElementById('globalFontSize').value;
            userSettings.autoSave = document.getElementById('autoSave').checked;
            saveSettings();
            applyVisualSettings();
            alert('✅ Personalización guardada correctamente');
        });
    }
    
    // Notifications form
    const notificationsForm = document.getElementById('notificationsForm');
    if (notificationsForm) {
        notificationsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            userSettings.emailNotifications = document.getElementById('emailNotifications').checked;
            userSettings.newBooks = document.getElementById('newBooks').checked;
            userSettings.readingReminders = document.getElementById('readingReminders').checked;
            saveSettings();
            alert('✅ Preferencias de notificaciones guardadas');
        });
    }
    
    // Security form
    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            const savedPassword = localStorage.getItem('userPassword');
            
            if (currentPassword !== savedPassword) {
                alert('❌ La contraseña actual es incorrecta');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                alert('❌ Las contraseñas nuevas no coinciden');
                return;
            }
            
            if (newPassword.length < 6) {
                alert('❌ La contraseña debe tener al menos 6 caracteres');
                return;
            }
            
            localStorage.setItem('userPassword', newPassword);
            alert('✅ Contraseña cambiada exitosamente');
            securityForm.reset();
        });
    }
}

function applyVisualSettings() {
    const globalFontSizes = {
        small: '14px',
        medium: '16px',
        large: '18px',
        xlarge: '20px'
    };
    
    if (userSettings.globalFontSize) {
        document.documentElement.style.fontSize = globalFontSizes[userSettings.globalFontSize] || '16px';
    }
    
    // Aplicar tema si está definido
    if (userSettings.appTheme && userSettings.appTheme !== 'original') {
        document.body.setAttribute('data-theme', userSettings.appTheme);
    } else {
        document.body.removeAttribute('data-theme');
    }
}

function resetVisualSettings() {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
        userSettings = {
            fontSize: 'medium',
            readerTheme: 'light',
            autoSave: true,
            emailNotifications: true,
            newBooks: false,
            readingReminders: true,
            appTheme: 'original',
            globalFontSize: 'medium'
        };
        saveSettings();
        populateSettingsFields();
        applyVisualSettings();
        alert('✅ Configuración restaurada');
    }
}

function deleteAccount() {
    if (confirm('⚠️ ¿Estás COMPLETAMENTE seguro? Esta acción eliminará todos tus datos y no se puede deshacer.')) {
        if (confirm('Esta es tu última oportunidad. ¿Realmente quieres eliminar tu cuenta?')) {
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem('userPassword');
            localStorage.removeItem(STORAGE_KEYS.FAVORITES);
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);
            alert('Tu cuenta ha sido eliminada');
            window.location.href = 'login.html';
        }
    }
}

// ========== MOBILE MENU ========== //
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

// ========== INITIALIZATION ========== //
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initIndexedDB();
        console.log('✅ IndexedDB inicializado correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar IndexedDB:', error);
    }
    
    loadSettings();
    applyVisualSettings();
    AuthService.init();

    const path = window.location.pathname;

    if (path.includes('login.html')) {
        setupAuthForm();
    }
    
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
    } else if (path.includes('library.html')) {
        initLibrary();
    } else if (path.includes('reader.html')) {
        initReader();
    } else if (path.includes('settings.html')) {
        initSettings();
    }
});

// Función legacy para compatibilidad
function logout() {
    AuthService.signOut();
}
