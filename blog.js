// ============================================================
//  blog.js — Système de blog + page admin
// ============================================================

window.ADMIN_UID = window.ADMIN_UID || 'HMuJBa53KceM7zQZ0ylpVPjV3Nh1';

// ----------------------------------------------------------
//  Firebase helpers
// ----------------------------------------------------------
function blogDb() { return firebase.firestore().collection('blog'); }

async function getBlogPosts(limitCount = 20, publishedOnly = true) {
  try {
    let q = blogDb().orderBy('createdAt', 'desc');
    if (publishedOnly) q = q.where('published', '==', true);
    q = q.limit(limitCount);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) {
    console.error('[Blog] getBlogPosts:', e);
    return [];
  }
}

async function saveBlogPost(data, id = null) {
  if (id) {
    await blogDb().doc(id).update({ ...data, updatedAt: new Date().toISOString() });
    return id;
  } else {
    const ref = await blogDb().add({ ...data, createdAt: new Date().toISOString() });
    return ref.id;
  }
}

async function deleteBlogPost(id) {
  await blogDb().doc(id).delete();
}

// ----------------------------------------------------------
//  Carrousel (intégré dans la page matchs)
// ----------------------------------------------------------
let _carouselPosts = [];
let _carouselIdx = 0;
let _carouselTimer = null;

async function initCarousel() {
  const container = document.getElementById('blog-carousel');
  if (!container) return;

  _carouselPosts = await getBlogPosts(5);
  if (_carouselPosts.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  renderCarousel();
  startCarouselAuto();
}

function renderCarousel() {
  const container = document.getElementById('blog-carousel');
  if (!container || _carouselPosts.length === 0) return;

  const post = _carouselPosts[_carouselIdx];
  const gameLabel = post.game && window.EsportAPI?.GAME_CONFIG?.[post.game]?.label;
  const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '';

  container.innerHTML = `
    <div class="carousel-slide" onclick="showBlogPost('${post.id}')" style="cursor:pointer">
      <div class="carousel-bg" style="${post.thumbnail ? `background-image:url('${post.thumbnail}')` : 'background: linear-gradient(135deg, #1a1e2c, #2a2f45)'}"></div>
      <div class="carousel-overlay"></div>
      <div class="carousel-content">
        <div class="carousel-meta">
          ${gameLabel ? `<span class="carousel-tag">${gameLabel}</span>` : ''}
          <span class="carousel-date">${date}</span>
        </div>
        <div class="carousel-title">${post.title}</div>
        ${post.excerpt ? `<div class="carousel-excerpt">${post.excerpt}</div>` : ''}
      </div>
      <div class="carousel-nav">
        <button class="carousel-arrow left" onclick="event.stopPropagation();carouselPrev()">‹</button>
        <div class="carousel-dots">
          ${_carouselPosts.map((_, i) => `<span class="carousel-dot ${i === _carouselIdx ? 'active' : ''}" onclick="event.stopPropagation();carouselGoTo(${i})"></span>`).join('')}
        </div>
        <button class="carousel-arrow right" onclick="event.stopPropagation();carouselNext()">›</button>
      </div>
    </div>
  `;
}

function carouselNext() {
  _carouselIdx = (_carouselIdx + 1) % _carouselPosts.length;
  renderCarousel();
  resetCarouselAuto();
}

function carouselPrev() {
  _carouselIdx = (_carouselIdx - 1 + _carouselPosts.length) % _carouselPosts.length;
  renderCarousel();
  resetCarouselAuto();
}

function carouselGoTo(i) {
  _carouselIdx = i;
  renderCarousel();
  resetCarouselAuto();
}

function startCarouselAuto() {
  if (_carouselPosts.length <= 1) return;
  _carouselTimer = setInterval(carouselNext, 5000);
}

function resetCarouselAuto() {
  clearInterval(_carouselTimer);
  startCarouselAuto();
}

// ----------------------------------------------------------
//  Page article
// ----------------------------------------------------------
async function showBlogPost(id) {
  const snap = await blogDb().doc(id).get();
  if (!snap.exists) return;
  const post = { id: snap.id, ...snap.data() };

  const old = document.getElementById('blog-post-modal');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'blog-post-modal';
  modal.className = 'modal-overlay';

  const gameLabel = post.game && window.EsportAPI?.GAME_CONFIG?.[post.game]?.label;
  const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const isAdmin = window.FirebaseService?.getCurrentUser()?.uid === ADMIN_UID;

  modal.innerHTML = `
    <div class="modal-box wide blog-post-box">
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:8px">
          ${gameLabel ? `<span class="carousel-tag">${gameLabel}</span>` : ''}
          <span style="font-size:12px;color:var(--text3)">${date}</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          ${isAdmin ? `<button class="blog-edit-btn" onclick="showBlogAdmin('${post.id}')">✏️ Modifier</button>` : ''}
          <button class="modal-close" onclick="document.getElementById('blog-post-modal').remove()">✕</button>
        </div>
      </div>
      ${post.thumbnail ? `<div class="blog-post-hero" style="background-image:url('${post.thumbnail}')"></div>` : ''}
      <h1 class="blog-post-title">${post.title}</h1>
      <div class="blog-post-content">${post.content.replace(/\n/g, '<br>')}</div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// ----------------------------------------------------------
//  Page admin
// ----------------------------------------------------------
async function showBlogAdmin(editId = null) {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user || user.uid !== window.ADMIN_UID) {
    alert('Accès non autorisé.');
    return;
  }

  const old = document.getElementById('blog-admin-modal');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'blog-admin-modal';
  modal.className = 'modal-overlay';

  // Charger les posts existants
  const posts = await getBlogPosts(50, false);

  modal.innerHTML = `
    <div class="modal-box wide blog-admin-box">
      <div class="modal-header">
        <div class="modal-title">✍️ Admin Blog</div>
        <button class="modal-close" onclick="document.getElementById('blog-admin-modal').remove()">✕</button>
      </div>

      <!-- Éditeur -->
      <div class="blog-editor" id="blog-editor">
        <div class="blog-editor-title" id="blog-editor-title">Nouvel article</div>
        <input type="hidden" id="blog-edit-id" value="${editId || ''}">

        <div class="form-group">
          <label>Titre *</label>
          <input type="text" id="blog-title" class="form-input" placeholder="Titre accrocheur...">
        </div>
        <div class="form-group">
          <label>Extrait (affiché dans le carrousel)</label>
          <input type="text" id="blog-excerpt" class="form-input" placeholder="Courte description...">
        </div>
        <div class="form-group">
          <label>Contenu *</label>
          <textarea id="blog-content" class="form-input blog-textarea" placeholder="Écrivez votre article ici..."></textarea>
        </div>
        <div class="form-group">
          <label>URL Image (thumbnail)</label>
          <input type="text" id="blog-thumbnail" class="form-input" placeholder="https://...">
        </div>
        <div class="form-group">
          <label>Jeu associé</label>
          <select id="blog-game" class="form-input">
            <option value="">— Tous les jeux —</option>
            ${Object.entries(window.EsportAPI?.GAME_CONFIG || {}).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="display:flex;align-items:center;gap:10px">
          <input type="checkbox" id="blog-published" style="width:auto">
          <label for="blog-published" style="margin:0;cursor:pointer">Publié (visible sur le site)</label>
        </div>
        <div id="blog-form-error" class="form-error" style="display:none"></div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button class="form-submit" onclick="saveBlogPostForm()">💾 Enregistrer</button>
          <button class="form-submit" style="background:var(--surface2);color:var(--text2)" onclick="resetBlogForm()">Annuler</button>
        </div>
      </div>

      <!-- Liste des articles -->
      <div class="blog-admin-list">
        <div class="blog-admin-list-title">Articles existants</div>
        ${posts.length === 0 ? '<div class="lb-empty">Aucun article pour l\'instant.</div>' : posts.map(p => `
          <div class="blog-admin-row">
            <div class="blog-admin-row-info">
              <span class="blog-admin-row-title">${p.title}</span>
              <span class="blog-admin-row-meta">${p.published ? '✅ Publié' : '⏳ Brouillon'} · ${p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : ''}</span>
            </div>
            <div class="blog-admin-row-actions">
              <button class="blog-admin-btn edit" onclick="loadBlogPostInEditor('${p.id}')">✏️</button>
              <button class="blog-admin-btn delete" onclick="confirmDeletePost('${p.id}')">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  // Si on édite un article existant, le charger
  if (editId) loadBlogPostInEditor(editId);
}

async function loadBlogPostInEditor(id) {
  const snap = await blogDb().doc(id).get();
  if (!snap.exists) return;
  const p = snap.data();

  document.getElementById('blog-edit-id').value = id;
  document.getElementById('blog-title').value = p.title || '';
  document.getElementById('blog-excerpt').value = p.excerpt || '';
  document.getElementById('blog-content').value = p.content || '';
  document.getElementById('blog-thumbnail').value = p.thumbnail || '';
  document.getElementById('blog-game').value = p.game || '';
  document.getElementById('blog-published').checked = p.published || false;
  document.getElementById('blog-editor-title').textContent = 'Modifier l\'article';

  document.getElementById('blog-editor').scrollIntoView({ behavior: 'smooth' });
}

function resetBlogForm() {
  document.getElementById('blog-edit-id').value = '';
  document.getElementById('blog-title').value = '';
  document.getElementById('blog-excerpt').value = '';
  document.getElementById('blog-content').value = '';
  document.getElementById('blog-thumbnail').value = '';
  document.getElementById('blog-game').value = '';
  document.getElementById('blog-published').checked = false;
  document.getElementById('blog-editor-title').textContent = 'Nouvel article';
}

async function saveBlogPostForm() {
  const title   = document.getElementById('blog-title')?.value?.trim();
  const content = document.getElementById('blog-content')?.value?.trim();
  const errEl   = document.getElementById('blog-form-error');

  if (!title || !content) {
    if (errEl) { errEl.textContent = 'Le titre et le contenu sont obligatoires.'; errEl.style.display = 'block'; }
    return;
  }
  if (errEl) errEl.style.display = 'none';

  const id        = document.getElementById('blog-edit-id')?.value || null;
  const excerpt   = document.getElementById('blog-excerpt')?.value?.trim() || '';
  const thumbnail = document.getElementById('blog-thumbnail')?.value?.trim() || '';
  const game      = document.getElementById('blog-game')?.value || '';
  const published = document.getElementById('blog-published')?.checked || false;

  try {
    await saveBlogPost({ title, excerpt, content, thumbnail, game, published }, id || null);
    // Rafraîchir le carrousel
    if (published) initCarousel();
    // Recharger la liste
    showBlogAdmin();
  } catch(e) {
    if (errEl) { errEl.textContent = 'Erreur lors de la sauvegarde.'; errEl.style.display = 'block'; }
  }
}

async function confirmDeletePost(id) {
  if (!confirm('Supprimer cet article définitivement ?')) return;
  await deleteBlogPost(id);
  initCarousel();
  showBlogAdmin();
}

// ----------------------------------------------------------
//  Accès admin via URL hash
// ----------------------------------------------------------
function checkAdminAccess() {
  if (window.location.hash === '#admin') {
    const user = window.FirebaseService?.getCurrentUser();
    if (user?.uid === ADMIN_UID) showBlogAdmin();
  }
}

window.initCarousel       = initCarousel;
window.showBlogPost       = showBlogPost;
window.showBlogAdmin      = showBlogAdmin;
window.saveBlogPostForm   = saveBlogPostForm;
window.resetBlogForm      = resetBlogForm;
window.loadBlogPostInEditor = loadBlogPostInEditor;
window.confirmDeletePost  = confirmDeletePost;
window.carouselNext       = carouselNext;
window.carouselPrev       = carouselPrev;
window.carouselGoTo       = carouselGoTo;
window.checkAdminAccess   = checkAdminAccess;

console.log('[blog] chargé ✓');
