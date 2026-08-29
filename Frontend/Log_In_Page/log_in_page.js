var SESSION_KEY = 'navhelp_session_v1';

    /* â”€â”€ CLOCK â”€â”€ */
    function updateClock(){
      var now = new Date();
      var h = String(now.getHours()).padStart(2,'0');
      var m = String(now.getMinutes()).padStart(2,'0');
      var s = String(now.getSeconds()).padStart(2,'0');
      var el = document.getElementById('navClock');
      if(el) el.textContent = h+':'+m+':'+s+' PHT';
    }
    updateClock();
    setInterval(updateClock,1000);

    /* â”€â”€ PASSWORD TOGGLE â”€â”€ */
    var CLOSED_EYE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3 13c2.6-3.2 5.7-5 9-5s6.4 1.8 9 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 14.5l-1.3 2.3M9.3 16.3l-.8 2.5M12 17l0 2.6M14.7 16.3l.8 2.5M18.5 14.5l1.3 2.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    var OPEN_EYE  = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M2.5 12s3.2-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.2 5.5-9.5 5.5S2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.7" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

    function togglePasswordVisibility(btn){
      var input = document.getElementById(btn.getAttribute('data-target'));
      if(!input) return;
      var showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.innerHTML = showing ? CLOSED_EYE : OPEN_EYE;
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      // Update tooltip on the wrapper span
      var wrap = btn.closest('.eyeBtn-wrap');
      if(wrap) wrap.setAttribute('data-tooltip', showing ? 'Show password' : 'Hide password');
    }

    document.querySelectorAll('.eyeBtn').forEach(function(b){
      b.addEventListener('click', function(){ togglePasswordVisibility(b); });
    });

    /* â”€â”€ LOGIN â”€â”€ */
    function getReturnUrl(){
      try{
        var p = new URLSearchParams(window.location.search);
        var r = p.get('return');
        if(r) return r;
      }catch(e){}
      return '';
    }

    function handleLogin(){
      var u = (document.getElementById('loginUsername').value||'').trim();
      var p = (document.getElementById('loginPassword').value||'').trim();
      if(!u || !p){ shakeCard(); return; }

      var btn = document.getElementById('loginBtn');
      btn.textContent = 'AUTHENTICATING...';
      btn.classList.add('loading');

      fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      })
      .then(function(res){ return res.json(); })
      .then(function(data){

        if(!data.token){
          btn.textContent = 'LOG IN';
          btn.classList.remove('loading');
          shakeCard();
          return;
        }

        // Save token and user info for use in other pages
        sessionStorage.setItem('tramsToken', data.token);
        sessionStorage.setItem('tramsUser', JSON.stringify(data.user));

        var role = data.user.account_type;
        if(role === 'Administrator') role = 'Admin';
        if(role === 'Super Administrator') role = 'Super Admin';
        var session = { userName: u, role: role };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        sessionStorage.setItem('tramsSession', JSON.stringify(session));

        // Redirect based on account_type from database
        if(role === 'Super Admin'){
          window.location.href = '/super-admin';
        } else if(role === 'Admin'){
          window.location.href = '/admin';
        } else {
          btn.textContent = 'LOG IN';
          btn.classList.remove('loading');
          shakeCard();
        }

      })
      .catch(function(){
        btn.textContent = 'LOG IN';
        btn.classList.remove('loading');
        shakeCard();
      });
    }

    function shakeCard(){
      var card = document.getElementById('loginCard');
      card.style.animation = 'shake 0.4s ease';
      setTimeout(function(){ card.style.animation = ''; }, 400);
    }

    /* shake keyframe injected dynamically */
    var shakeStyle = document.createElement('style');
    shakeStyle.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}';
    document.head.appendChild(shakeStyle);

    /* Enter key */
    ['loginUsername','loginPassword'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.addEventListener('keydown', function(e){ if(e.key==='Enter') handleLogin(); });
    });

    /* redirect if already logged in */
    (function(){
      try{
        // Only auto-redirect if token AND session both exist
        var token = sessionStorage.getItem('tramsToken');
        var raw   = sessionStorage.getItem(SESSION_KEY);
        if(!token || !raw) return;
        var sess = JSON.parse(raw);
        if(!sess || !sess.role) return;
        var ret = getReturnUrl();
        if(ret){
          if(ret.indexOf('role=Admin')!==-1 && sess.role!=='Admin') return;
          if(ret.indexOf('role=Super')!==-1 && sess.role!=='Super Admin') return;
          window.location.replace(ret); return;
        }
        window.location.replace(sess.role==='Super Admin'?'/super-admin':(sess.role==='Admin'?'/admin':'/login'));
      }catch(e){}
    })();

    /* â”€â”€ GALLERY â”€â”€ */
    var currentSlide = 0;
    var track = document.getElementById('galleryTrack');
    var autoSlideTimer;

    function updateSlide(){
      var w = track.parentElement.clientWidth;
      track.style.transform = 'translateX(-'+(currentSlide*w)+'px)';
      updateDots();
    }

    function nextSlide(){
      currentSlide = (currentSlide+1) % track.children.length;
      updateSlide();
    }

    function prevSlide(){
      currentSlide = (currentSlide-1+track.children.length) % track.children.length;
      updateSlide();
    }

    function goToSlide(i){
      currentSlide = i;
      updateSlide();
      resetAutoSlide();
    }

    function updateDots(){
      document.querySelectorAll('.gallery-dots span').forEach(function(d,i){
        d.classList.toggle('active', i===currentSlide);
      });
    }

    function resetAutoSlide(){
      clearInterval(autoSlideTimer);
      autoSlideTimer = setInterval(nextSlide, 4000);
    }

    resetAutoSlide();
    updateDots();

    window.addEventListener('resize', updateSlide);

    /* touch swipe */
    var startX = 0;
    track.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; });
    track.addEventListener('touchend', function(e){
      var dx = e.changedTouches[0].clientX - startX;
      if(dx < -50) nextSlide();
      else if(dx > 50) prevSlide();
      resetAutoSlide();
    });

    /* â”€â”€ PARTICLE CANVAS â”€â”€ */
    (function(){
      var canvas = document.getElementById('particleCanvas');
      if(!canvas) return;
      var ctx = canvas.getContext('2d');
      var particles = [];
      var W, H;

      function resize(){
        W = canvas.width  = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
      }

      function Particle(){
        this.x = Math.random()*W;
        this.y = Math.random()*H;
        this.vx = (Math.random()-0.5)*0.4;
        this.vy = (Math.random()-0.5)*0.4;
        this.r  = Math.random()*1.5+0.5;
        this.a  = Math.random()*0.5+0.1;
      }

      Particle.prototype.update = function(){
        this.x += this.vx;
        this.y += this.vy;
        if(this.x<0||this.x>W) this.vx*=-1;
        if(this.y<0||this.y>H) this.vy*=-1;
      };

      function init(){
        resize();
        particles = [];
        var count = Math.floor((W*H)/8000);
        for(var i=0;i<count;i++) particles.push(new Particle());
      }

      function draw(){
        ctx.clearRect(0,0,W,H);
        particles.forEach(function(p){ p.update(); });

        /* draw connections */
        for(var i=0;i<particles.length;i++){
          for(var j=i+1;j<particles.length;j++){
            var dx = particles[i].x - particles[j].x;
            var dy = particles[i].y - particles[j].y;
            var dist = Math.sqrt(dx*dx+dy*dy);
            if(dist<100){
              ctx.beginPath();
              ctx.strokeStyle = 'rgba(0,200,255,'+(0.12*(1-dist/100))+')';
              ctx.lineWidth = 0.5;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
          ctx.beginPath();
          ctx.arc(particles[i].x, particles[i].y, particles[i].r, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(0,200,255,'+particles[i].a+')';
          ctx.fill();
        }
        requestAnimationFrame(draw);
      }

      init();
      draw();
      window.addEventListener('resize', init);
    })();