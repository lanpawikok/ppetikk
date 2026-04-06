/*==================== INSPECT PROTECTION SYSTEM ====================*/
(function() {
    const CORRECT_PASSWORD = "LAWLA";
    let devToolsUnlocked = false;

    // ── Inject overlay CSS
    const style = document.createElement('style');
    style.textContent = `
        #__lock-overlay {
            position: fixed; inset: 0;
            background: rgba(10,10,15,0.97);
            backdrop-filter: blur(20px);
            z-index: 2147483647;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none;
            transition: opacity .3s;
            font-family: 'DM Mono', monospace, sans-serif;
        }
        #__lock-overlay.active { opacity: 1; pointer-events: all; }
        #__lock-box {
            background: #13131a;
            border: 1px solid #22223a;
            border-radius: 20px;
            padding: 3rem;
            max-width: 420px; width: 90%;
            text-align: center;
            box-shadow: 0 0 80px rgba(200,245,66,.08);
        }
        #__lock-icon { font-size: 2.5rem; margin-bottom: 1.2rem; animation: __pulse 2s infinite; }
        @keyframes __pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        #__lock-title {
            font-size: 1.5rem; font-weight: 800; color: #c8f542;
            margin-bottom: .5rem; letter-spacing: -.02em;
        }
        #__lock-sub { color: #5a5a72; font-size: .82rem; line-height: 1.6; margin-bottom: 1.8rem; }
        #__lock-input-wrap { position: relative; margin-bottom: .8rem; }
        #__pw-input {
            width: 100%; background: #0a0a0f;
            border: 1.5px solid #22223a; border-radius: 8px;
            padding: .9rem 3rem .9rem 1.2rem;
            color: #e8e8f0; font-family: inherit;
            font-size: 1rem; letter-spacing: .2em; outline: none;
            transition: border-color .2s; box-sizing: border-box;
        }
        #__pw-input:focus { border-color: #c8f542; }
        #__toggle-pw {
            position: absolute; right: .9rem; top: 50%; transform: translateY(-50%);
            background: none; border: none; color: #5a5a72; cursor: pointer; font-size: 1.1rem;
        }
        #__pw-submit {
            width: 100%; background: #c8f542; color: #0a0a0f;
            border: none; border-radius: 8px; padding: .9rem;
            font-size: 1rem; font-weight: 700; cursor: pointer;
            transition: opacity .2s, transform .1s; letter-spacing: .04em;
        }
        #__pw-submit:hover { opacity: .85; }
        #__pw-submit:active { transform: scale(.98); }
        #__pw-error { color: #ff6b6b; font-size: .8rem; margin-top: .6rem; min-height: 1.2rem; display: block; }
        #__lock-hint { color: #5a5a72; font-size: .72rem; margin-top: 1.2rem; }
    `;
    document.head.appendChild(style);

    // ── Inject overlay HTML
    const overlay = document.createElement('div');
    overlay.id = '__lock-overlay';
    overlay.innerHTML = `
        <div id="__lock-box">
            <div id="__lock-icon">🔒</div>
            <div id="__lock-title">Akses Terbatas</div>
            <div id="__lock-sub">Halaman ini dilindungi.<br>Masukkan password untuk membuka <strong style="color:#e8e8f0">DevTools</strong>.</div>
            <div id="__lock-input-wrap">
                <input type="password" id="__pw-input" placeholder="••••••" maxlength="20" autocomplete="off"/>
                <button id="__toggle-pw" tabindex="-1">👁</button>
            </div>
            <button id="__pw-submit">UNLOCK</button>
            <span id="__pw-error"></span>
            <p id="__lock-hint">* Hanya yang tahu password yang boleh inspect</p>
        </div>
    `;
    document.body.appendChild(overlay);

    const pwInput  = document.getElementById('__pw-input');
    const pwSubmit = document.getElementById('__pw-submit');
    const pwError  = document.getElementById('__pw-error');
    const toggleBtn = document.getElementById('__toggle-pw');

    function showLock(msg) {
        overlay.classList.add('active');
        if(msg) pwError.textContent = msg;
        pwInput.value = '';
        setTimeout(() => pwInput.focus(), 100);
    }

    function hideLock() {
        overlay.classList.remove('active');
        pwError.textContent = '';
    }

    function checkPassword() {
        if(pwInput.value.trim().toUpperCase() === CORRECT_PASSWORD) {
            devToolsUnlocked = true;
            hideLock();
        } else {
            pwError.textContent = '❌ Password salah, coba lagi.';
            pwInput.style.borderColor = '#ff4d4d';
            setTimeout(() => { pwInput.style.borderColor = ''; }, 800);
            pwInput.value = '';
            pwInput.focus();
        }
    }

    pwSubmit.addEventListener('click', checkPassword);
    pwInput.addEventListener('keydown', e => { if(e.key === 'Enter') checkPassword(); });
    toggleBtn.addEventListener('click', () => {
        pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
        toggleBtn.textContent = pwInput.type === 'password' ? '👁' : '🙈';
    });

    // ── Detect DevTools via window size diff
    let devToolsOpen = false;
    function detectDevTools() {
        if(devToolsUnlocked) return false;
        return (window.outerWidth - window.innerWidth > 160) ||
               (window.outerHeight - window.innerHeight > 160);
    }
    setInterval(() => {
        if(devToolsUnlocked) return;
        if(detectDevTools()) {
            if(!devToolsOpen) {
                devToolsOpen = true;
                showLock('🔍 DevTools terdeteksi! Masukkan password.');
            }
        } else {
            devToolsOpen = false;
        }
    }, 600);

    // ── Block right-click
    document.addEventListener('contextmenu', e => {
        if(!devToolsUnlocked) {
            e.preventDefault();
            showLock('🚫 Klik kanan dinonaktifkan. Masukkan password.');
        }
    });

    // ── Block keyboard shortcuts
    document.addEventListener('keydown', e => {
        if(devToolsUnlocked) return;
        const blocked =
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c','K','k'].includes(e.key)) ||
            (e.ctrlKey && ['U','u'].includes(e.key)) ||
            (e.metaKey && e.altKey && ['I','i','J','j','C','c'].includes(e.key));
        if(blocked) {
            e.preventDefault();
            showLock('⌨️ Shortcut DevTools diblokir. Masukkan password.');
        }
    });

    // ── Console warning
    console.log('%c🔒 STOP!', 'color:#c8f542;font-size:2rem;font-weight:900;');
    console.log('%cHalaman ini dilindungi. Masukkan password melalui popup yang muncul.', 'color:#5a5a72;font-size:1rem;');

})();


/*==================== MENU SHOW Y HIDDEN ====================*/
const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close')

/*===== MENU SHOW =====*/
if(navToggle){
    navToggle.addEventListener('click', () =>{
        navMenu.classList.add('show-menu')
    })
}

/*===== MENU HIDDEN =====*/
if(navClose){
    navClose.addEventListener('click', () =>{
        navMenu.classList.remove('show-menu')
    })
}

/*==================== REMOVE MENU MOBILE ====================*/
const navLink = document.querySelectorAll('.nav__link')

function linkAction(){
    const navMenu = document.getElementById('nav-menu')
    navMenu.classList.remove('show-menu')
}
navLink.forEach(n => n.addEventListener('click', linkAction))

/*==================== ACCORDION SKILLS ====================*/
const skillsContent = document.getElementsByClassName('skills__content'),
      skillsHeader = document.querySelectorAll('.skills__header')

function toggleSkills(){
    let itemClass = this.parentNode.className

    for(i = 0; i < skillsContent.length; i++){
        skillsContent[i].className = 'skills__content skills__close'
    }
    if(itemClass === 'skills__content skills__close'){
        this.parentNode.className = 'skills__content skills__open'
    }
}

skillsHeader.forEach((el) =>{
    el.addEventListener('click', toggleSkills)
})

/*==================== EDUCATION TABS ====================*/
const tabs = document.querySelectorAll('[data-target]'),
      tabContents = document.querySelectorAll('[data-content]')

tabs.forEach(tab =>{
    tab.addEventListener('click', () =>{
        const target = document.querySelector(tab.dataset.target)

        tabContents.forEach(tabContent =>{
            tabContent.classList.remove('education__active')
        })
        target.classList.add('education__active')

        tabs.forEach(tab =>{
            tab.classList.remove('education__active')
        })
        tab.classList.add('education__active')
    })
})

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
const sections = document.querySelectorAll('section[id]')

function scrollActive(){
    const scrollY = window.pageYOffset

    sections.forEach(current =>{
        const sectionHeight = current.offsetHeight
        const sectionTop = current.offsetTop - 50;
        sectionId = current.getAttribute('id')

        if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight){
            document.querySelector('.nav__menu a[href*=' + sectionId + ']').classList.add('active-link')
        }else{
            document.querySelector('.nav__menu a[href*=' + sectionId + ']').classList.remove('active-link')
        }
    })
}
window.addEventListener('scroll', scrollActive)

/*==================== CHANGE BACKGROUND HEADER ====================*/
function scrollHeader(){
    const nav = document.getElementById('header')
    if(this.scrollY >= 200) nav.classList.add('scroll-header'); else nav.classList.remove('scroll-header')
}
window.addEventListener('scroll', scrollHeader)

/*==================== SHOW SCROLL UP ====================*/
function scrollUp(){
    const scrollUp = document.getElementById('scroll-up');
    if(this.scrollY >= 560) scrollUp.classList.add('show-scroll'); else scrollUp.classList.remove('show-scroll')
}
window.addEventListener('scroll', scrollUp)

/*==================== ANIMATE SKILLS BAR ON SCROLL ====================*/
const skillsSection = document.getElementById('skills');
const progressBars = document.querySelectorAll('.skills__percentage');

function showProgress(){
    progressBars.forEach(progressBar => {
        const value = progressBar.style.width;
        progressBar.style.width = '0';
        setTimeout(() => {
            progressBar.style.width = value;
        }, 100);
    });
}

let skillsAnimated = false;

window.addEventListener('scroll', () => {
    const sectionPos = skillsSection.getBoundingClientRect().top;
    const screenPos = window.innerHeight / 2;

    if(sectionPos < screenPos && !skillsAnimated){
        showProgress();
        skillsAnimated = true;
    }
});

/*==================== FORM VALIDATION ====================*/
const contactForm = document.getElementById('contact-form');

if(contactForm){
    contactForm.addEventListener('submit', function(e){
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const subject = document.getElementById('contact-subject').value;
        const message = document.getElementById('contact-message').value;
        
        if(name === '' || email === '' || subject === '' || message === ''){
            e.preventDefault();
            alert('Mohon lengkapi semua field!');
            return false;
        }
        
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailPattern.test(email)){
            e.preventDefault();
            alert('Mohon masukkan email yang valid!');
            return false;
        }
        
        alert('Terima kasih! Pesan Anda akan segera diproses.');
    });
}

/*==================== SMOOTH SCROLL FOR ANCHOR LINKS ====================*/
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if(target){
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});