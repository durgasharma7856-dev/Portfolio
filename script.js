let adminPassword = "";
let currentFiles = [];
let currentZoom = 1;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    setupScrollAnimations();
    loadDynamicContent();
    checkAdminMode();
});

async function loadDynamicContent() {
    try {
        const [settings, projects, certs, content, skills, traits, services] = await Promise.all([
            fetch('/api/settings').then(res => res.json()),
            fetch('/api/projects').then(res => res.json()),
            fetch('/api/certifications').then(res => res.json()),
            fetch('/api/content').then(res => res.json()),
            fetch('/api/skills').then(res => res.json()),
            fetch('/api/soft_skills').then(res => res.json()),
            fetch('/api/services').then(res => res.json())
        ]);

        if(settings.profilePhoto) document.getElementById('profilePhoto').src = settings.profilePhoto;
        if(settings.cvPath) document.getElementById('floatingResume').href = settings.cvPath;
        if(settings.cvPath) document.getElementById('cvDownload').href = settings.cvPath;

        applyContent(content);

        // Projects
        renderProjects(projects.filter(p => p.status === 'completed'), 'completedProjectsGrid');
        renderProjects(projects.filter(p => p.status === 'ongoing'), 'ongoingProjectsGrid');

        // Skills (Now with Image Icon)
        document.getElementById('skillsGrid').innerHTML = skills.map((s, i) => `
            <div class="skill-card reveal" style="transition-delay: ${i*0.1}s">
                ${adminPassword ? `<div class="admin-edit-btn" onclick='editSkill(${JSON.stringify(s)})'><i class="fas fa-pencil-alt"></i></div> <div class="admin-edit-btn" onclick="deleteItem('skills', ${s.id})" style="top:10px; left:10px; background:rgba(255,0,0,0.5);"><i class="fas fa-trash"></i></div>` : ''}
                <img src="${s.icon}" class="skill-icon-img" alt="${s.name}">
                <h4>${s.name}</h4>
                <span class="skill-badge ${s.level}">${s.level}</span>
                <p>${s.description}</p>
            </div>
        `).join('');

        // Traits (Why Me)
        document.getElementById('traitsGrid').innerHTML = traits.map((t, i) => `
            <div class="trait-card reveal" style="transition-delay: ${i*0.1}s">
                ${adminPassword ? `<div class="admin-edit-btn" onclick='editTrait(${JSON.stringify(t)})'><i class="fas fa-pencil-alt"></i></div> <div class="admin-edit-btn" onclick="deleteItem('soft_skills', ${t.id})" style="top:10px; left:10px; background:rgba(255,0,0,0.5);"><i class="fas fa-trash"></i></div>` : ''}
                <h4>${t.title}</h4>
                <p>${t.description}</p>
            </div>
        `).join('');

        // Services
        document.getElementById('servicesGrid').innerHTML = services.map((s, i) => `
            <div class="service-card reveal" style="transition-delay: ${i*0.1}s">
                ${adminPassword ? `<div class="admin-edit-btn" onclick='editService(${JSON.stringify(s)})'><i class="fas fa-pencil-alt"></i></div> <div class="admin-edit-btn" onclick="deleteItem('services', ${s.id})" style="top:10px; left:10px; background:rgba(255,0,0,0.5);"><i class="fas fa-trash"></i></div>` : ''}
                <h4>${s.title}</h4>
                <p>${s.description}</p>
            </div>
        `).join('');

        // Certs
        document.getElementById('certsGrid').innerHTML = certs.map(c => {
            const canvasId = `pdf-thumb-${c.id}`;
            setTimeout(() => renderPdfThumbnail(c.image, canvasId), 100);
            return `
            <div class="cert-card reveal">
                ${adminPassword ? `<div class="admin-edit-btn" onclick="deleteItem('certifications', ${c.id})"><i class="fas fa-trash"></i></div>` : ''}
                <canvas id="${canvasId}" class="cert-canvas" onclick="window.open('${c.image}', '_blank')"></canvas>
                <h3>${c.name}</h3>
                <p style="color:var(--secondary);">${c.organization}</p>
                <small>${c.date}</small>
                ${c.link ? `<a href="${c.link}" target="_blank" class="btn btn-primary" style="margin-top:1rem; width:100%; display:block; text-align:center;">View Certificate</a>` : ''}
            </div>`;
        }).join('');

        setupScrollAnimations();
        hidePreloader();
        injectTextEditButtons();
    } catch (e) { console.error(e); hidePreloader(); }
}

// 2. PROJECT RENDERING (Pills)
function renderProjects(list, gridId) {
    const grid = document.getElementById(gridId);
    if(list.length === 0) { grid.innerHTML = `<p style="color:var(--secondary); width:100%;">No projects yet.</p>`; return; }
    grid.innerHTML = list.map(p => {
        const mediaHtml = p.media && p.media.length > 0 ? p.media.map(m => m.endsWith('.mp4') ? `<video src="${m}" controls class="carousel-item"></video>` : `<img src="${m}" class="carousel-item" onclick="openFullscreen(this.src)">`).join('') : `<img src="https://via.placeholder.com/400" class="carousel-item">`;
        
        // Generate Pills from text
        const toolsHtml = p.tools ? p.tools.split(',').map(t => `<span class="project-tag">${t.trim()}</span>`).join(' ') : '';
        
        const viewBtn = p.link ? `<a href="${p.link}" target="_blank" class="btn btn-primary" style="flex:1; text-align:center;">View</a>` : '';
        const delBtn = adminPassword ? `<button onclick="deleteItem('projects', ${p.id})" class="btn" style="background:rgba(255,68,68,0.1); color:#ff4444; border:1px solid #ff4444; flex:0 0 50px; display:grid; place-items:center;"><i class="fas fa-trash"></i></button>` : '';
        
        return `<div class="project-card reveal">
            ${adminPassword ? `<div class="admin-edit-btn" onclick='editProject(${JSON.stringify(p)})'><i class="fas fa-pencil-alt"></i></div>` : ''}
            <div class="carousel-container">${mediaHtml}</div>
            <h3>${p.title}</h3>
            <div class="project-tools" style="margin-bottom:0.5rem; border:none;">${toolsHtml}</div>
            <p style="font-size:0.9rem;">${p.description}</p>
            <div style="margin-top:1.5rem; display:flex; gap:10px;">${viewBtn} ${delBtn}</div>
        </div>`;
    }).join('');
}

// 3. PROJECT MODAL
function openProjectModal(status) { document.getElementById('projectForm').reset(); document.getElementById('pId').value = ''; document.getElementById('pStatus').value = status; currentFiles=[]; renderMediaPreviews(); document.getElementById('modalTitle').innerText = status === 'completed' ? 'Add Completed Project' : 'Add Ongoing Project'; document.getElementById('projectModal').style.display='block'; }
window.editProject = function(p) { document.getElementById('pId').value=p.id; document.getElementById('pStatus').value=p.status; document.getElementById('pTitle').value=p.title; document.getElementById('pDesc').value=p.description; document.getElementById('pLink').value=p.link||''; document.getElementById('pTools').value=p.tools||''; currentFiles=p.media||[]; renderMediaPreviews(); document.getElementById('modalTitle').innerText='Edit Project'; document.getElementById('projectModal').style.display='block'; }
document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('id', document.getElementById('pId').value);
    fd.append('status', document.getElementById('pStatus').value);
    fd.append('title', document.getElementById('pTitle').value);
    fd.append('description', document.getElementById('pDesc').value);
    fd.append('link', document.getElementById('pLink').value);
    fd.append('tools', document.getElementById('pTools').value); // Send text directly
    fd.append('password', adminPassword);
    currentFiles.filter(f => f instanceof File).forEach(f => fd.append('mediaFiles', f));
    fd.append('existingMedia', JSON.stringify(currentFiles.filter(f => !(f instanceof File))));
    await fetch('/api/projects', { method: 'POST', body: fd });
    location.reload();
});

// 4. SKILLS MODAL (Image Upload)
function openSkillModal() { document.getElementById('skillForm').reset(); document.getElementById('skillModal').style.display = 'block'; }
window.editSkill = function(s) { document.getElementById('sId').value=s.id; document.getElementById('sName').value=s.name; document.getElementById('sDesc').value=s.description; document.getElementById('sExistingIcon').value=s.icon; document.querySelectorAll('input[name="sLevel"]').forEach(r=>{if(r.value===s.level)r.checked=true}); document.getElementById('skillModal').style.display='block'; }
document.getElementById('skillForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('id', document.getElementById('sId').value);
    fd.append('name', document.getElementById('sName').value);
    fd.append('description', document.getElementById('sDesc').value);
    fd.append('level', document.querySelector('input[name="sLevel"]:checked').value);
    fd.append('password', adminPassword);
    if(document.getElementById('sIcon').files[0]) fd.append('skillIcon', document.getElementById('sIcon').files[0]);
    fd.append('existingIcon', document.getElementById('sExistingIcon').value);
    await fetch('/api/skills', { method: 'POST', body: fd });
    location.reload();
});

// 5. TRAITS & SERVICES
function openTraitModal() { document.getElementById('traitForm').reset(); document.getElementById('traitModal').style.display = 'block'; }
window.editTrait = function(t) { document.getElementById('tId').value=t.id; document.getElementById('tTitle').value=t.title; document.getElementById('tDesc').value=t.description; document.getElementById('traitModal').style.display='block'; }
document.getElementById('traitForm').addEventListener('submit', async (e) => { e.preventDefault(); const fd = { id: document.getElementById('tId').value, title: document.getElementById('tTitle').value, description: document.getElementById('tDesc').value, password: adminPassword }; await fetch('/api/soft_skills', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(fd) }); location.reload(); });

function openServiceModal() { document.getElementById('serviceForm').reset(); document.getElementById('serviceModal').style.display = 'block'; }
window.editService = function(s) { document.getElementById('svcId').value=s.id; document.getElementById('svcTitle').value=s.title; document.getElementById('svcDesc').value=s.description; document.getElementById('serviceModal').style.display='block'; }
document.getElementById('serviceForm').addEventListener('submit', async (e) => { e.preventDefault(); const fd = { id: document.getElementById('svcId').value, title: document.getElementById('svcTitle').value, description: document.getElementById('svcDesc').value, password: adminPassword }; await fetch('/api/services', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(fd) }); location.reload(); });

// ... (KEEP ALL EXISTING FUNCTIONS: Admin Check, Media Preview, Certs, Settings, Fullscreen, etc.)
// [I will include the media/cert logic here for completeness]
function handleFileSelect(input) { currentFiles = [...currentFiles, ...Array.from(input.files)]; renderMediaPreviews(); input.value = ''; }
function renderMediaPreviews() { const grid = document.getElementById('mediaPreviewGrid'); grid.innerHTML = ''; currentFiles.forEach((item, index) => { const div = document.createElement('div'); div.className = 'media-thumb-box'; const src = (item instanceof File) ? URL.createObjectURL(item) : item; div.innerHTML = `<img src="${src}"><button type="button" class="remove-media-btn" onclick="removeMedia(${index})"><i class="fas fa-times"></i></button>`; grid.appendChild(div); }); }
window.removeMedia = function(i) { currentFiles.splice(i, 1); renderMediaPreviews(); }
function openCertModal() { document.getElementById('certForm').reset(); document.getElementById('certModal').style.display = 'block'; }
document.getElementById('certForm').addEventListener('submit', async (e) => { e.preventDefault(); const fd = new FormData(); fd.append('name', document.getElementById('cName').value); fd.append('organization', document.getElementById('cOrg').value); fd.append('date', document.getElementById('cDate').value); fd.append('link', document.getElementById('cLink').value); if(document.getElementById('cImg').files[0]) fd.append('certImage', document.getElementById('cImg').files[0]); fd.append('password', adminPassword); await fetch('/api/certifications', { method: 'POST', body: fd }); location.reload(); });
window.deleteItem = async function(t, id) { if(confirm("Delete?")) await fetch(`/api/${t}/delete`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id, password:adminPassword})}); location.reload(); }
async function uploadSetting(k, i) { const f = document.getElementById(i).files[0]; if(f) { const fd = new FormData(); fd.append('file', f); await fetch(`/api/settings/${k}`, {method:'POST', body:fd}); location.reload(); } }

// Replace the old checkAdminMode function with this:
async function checkAdminMode() {
    const u = new URLSearchParams(window.location.search);
    if (u.get('mode') === 'admin') {
        const p = prompt("Password:");
        
        // Send password to server to check
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: p })
            });
            const data = await res.json();

            if (data.success) {
                adminPassword = p; // Keep password in memory for future requests
                document.getElementById('adminFab').style.display = 'flex';
                document.getElementById('profileEditBtn').style.display = 'flex';
                injectTextEditButtons();
            } else {
                alert("Incorrect Password");
            }
        } catch (e) {
            console.error("Login check failed", e);
        }
    }
}

function toggleFabMenu() { const m = document.querySelector('.fab-options'); m.style.display = m.style.display === 'flex' ? 'none' : 'flex'; }
window.openAdminModal = function() { document.getElementById('adminModal').style.display = 'block'; }
window.showAdminTab = function(t) { document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none'); document.getElementById(`tab-${t}`).style.display = 'block'; if(t === 'messages') loadMessages(); }
function injectTextEditButtons() { if(!adminPassword) return; const ids = [{id:'disp_hero_title',k:'hero_title'},{id:'disp_hero_desc',k:'hero_desc'},{id:'disp_about_text',k:'about_text'},{id:'disp_email',k:'email'},{id:'disp_phone',k:'phone'},{id:'disp_address',k:'address'}]; ids.forEach(i => { const el = document.getElementById(i.id); if(el && !el.querySelector('.text-edit-btn')) { const b = document.createElement('i'); b.className = 'fas fa-pencil-alt text-edit-btn'; b.onclick = async (e) => { e.stopPropagation(); const t = prompt("Edit:", el.innerText); if(t) { await fetch('/api/content', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: i.k, text: t, password: adminPassword }) }); location.reload(); } }; el.appendChild(b); } }); }
function applyContent(d) { if(!d)return; const m = {'hero_title':'disp_hero_title', 'hero_desc':'disp_hero_desc', 'about_text':'disp_about_text', 'email':'disp_email', 'phone':'disp_phone', 'address':'disp_address', 'metric_1':'disp_metric_1', 'metric_2':'disp_metric_2', 'metric_3':'disp_metric_3'}; for(const [k, id] of Object.entries(m)) { if(document.getElementById(id) && d[k]) { if(id === 'disp_email') { document.getElementById(id).href = `https://mail.google.com/mail/?view=cm&fs=1&to=${d[k]}`; document.getElementById(id).target = "_blank"; document.getElementById(id).innerText = d[k]; } else { document.getElementById(id).innerText = d[k]; } } if(adminPassword && document.getElementById('edit_'+k)) document.getElementById('edit_'+k).value = d[k]; } }
function setupTheme() { const b = document.getElementById('themeToggle'); b.addEventListener('click', () => { const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', t); }); }
function setupScrollAnimations() { const obs = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting) e.target.classList.add('active'); }), {threshold:0.1}); document.querySelectorAll('.reveal').forEach(el => obs.observe(el)); }
function hidePreloader() { const p = document.getElementById('preloader'); p.style.opacity = '0'; setTimeout(() => p.style.display = 'none', 500); }
function toggleMobileMenu() { document.getElementById('navWrapper').classList.toggle('active'); }
function closeMobileMenu() { document.getElementById('navWrapper').classList.remove('active'); }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openFullscreen(src) { document.getElementById("fullscreenViewer").style.display = "block"; document.getElementById("fullscreenImg").src = src; currentZoom=1; document.getElementById("fullscreenImg").style.transform=`scale(1)`; }
function closeFullscreen(e) { if(e && e.target !== e.currentTarget && !e.target.classList.contains('close-fullscreen')) return; document.getElementById("fullscreenViewer").style.display = "none"; }
function zoomImage(s) { currentZoom+=s; if(currentZoom<0.5) currentZoom=0.5; if(currentZoom>3)currentZoom=3; document.getElementById("fullscreenImg").style.transform=`scale(${currentZoom})`; }
function resetZoom() { currentZoom=1; document.getElementById("fullscreenImg").style.transform=`scale(1)`; }
function handleWheelZoom(e) { e.preventDefault(); zoomImage(e.deltaY>0?-0.1:0.1); }
window.addEventListener('scroll', () => { const b = document.getElementById('scrollTopBtn'); if(window.scrollY > 500) b.classList.add('show'); else b.classList.remove('show'); });
async function renderPdfThumbnail(url, canvasId) { if (!url || !url.endsWith('.pdf')) return; try { const pdf = await pdfjsLib.getDocument(url).promise; const page = await pdf.getPage(1); const viewport = page.getViewport({ scale: 1.5 }); const canvas = document.getElementById(canvasId); if (canvas) { const ctx = canvas.getContext('2d'); canvas.height = viewport.height; canvas.width = viewport.width; await page.render({ canvasContext: ctx, viewport: viewport }).promise; } } catch (e) { console.error(e); } }
async function loadMessages() { const res = await fetch('/api/messages', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ password: adminPassword }) }); const msgs = await res.json(); const list = document.getElementById('inboxList'); if(msgs.length === 0) { list.innerHTML = "<p>No messages yet.</p>"; return; } list.innerHTML = msgs.map(m => `<div class="msg-card"><div class="msg-header"><span class="msg-name">${m.name}</span><span class="msg-date">${m.date}</span></div><a href="mailto:${m.email}" class="msg-email">${m.email}</a><div class="msg-body">${m.message}</div></div>`).join(''); }
async function saveContent(id, inputId) { const text = document.getElementById(inputId).value; await fetch('/api/content', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id, text, password: adminPassword }) }); alert("Saved!"); loadDynamicContent(); }
document.getElementById('contactForm').addEventListener('submit', async (e) => { e.preventDefault(); const data = { name: document.getElementById('msgName').value, email: document.getElementById('msgEmail').value, message: document.getElementById('msgText').value }; await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); alert("Message Sent! Thank you."); document.getElementById('contactForm').reset(); });
