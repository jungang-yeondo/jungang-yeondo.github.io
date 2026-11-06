(function(){
  // 설립연도 기준 년수 자동 계산 ({년수})
  document.querySelectorAll('.years-since').forEach(function(e){var y=new Date().getFullYear()-parseInt(e.dataset.from,10);if(y>0)e.textContent=y;});
  var body=document.body;
  function setOver(){body.classList.toggle('over',window.scrollY<60)}
  window.addEventListener('scroll',setOver,{passive:true}); setOver();

  var mb=document.getElementById('menuBtn'), mn=document.getElementById('mnav');
  if(mb) mb.addEventListener('click',function(){var o=mn.classList.toggle('open');body.classList.toggle('menu-open',o);mb.setAttribute('aria-expanded',o)});

  // 메인 슬라이드
  var hero=document.getElementById('hero');
  if(hero){
    var slides=[].slice.call(hero.querySelectorAll('.slide')), si=0, prog=document.getElementById('prog');
    var sec=Number(hero.dataset.interval)||6;
    if(prog) prog.style.animationDuration=sec+'s';
    var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(slides.length>1 && !reduce) setInterval(function(){
      slides[si].classList.remove('on'); si=(si+1)%slides.length; slides[si].classList.add('on');
      document.getElementById('sIdx').textContent=(si+1<10?'0':'')+(si+1);
      document.getElementById('sCap').textContent=slides[si].dataset.cap||'';
      prog.classList.remove('run'); void prog.offsetWidth; prog.classList.add('run');
    },sec*1000);
  }

  // 시공실적 필터·검색
  var tb=document.querySelector('#rtable tbody');
  if(tb){
    var rows=[].slice.call(tb.rows), cur='전체', q=document.getElementById('q'), fbox=document.getElementById('filters');
    // 처음엔 data-show 개수만, 나머지는 '전체 보기'
    var more=document.getElementById('refMore'), show=Number(document.getElementById('rtable').dataset.show)||Infinity, open=false;
    function draw(){
      var k=q.value.trim().toLowerCase(), n=0;
      rows.forEach(function(r){var ok=(cur==='전체'||r.dataset.cat===cur)&&(!k||r.textContent.toLowerCase().indexOf(k)>-1);r.hidden=!ok||(!open&&n>=show);if(ok)n++});
      document.getElementById('countLine').innerHTML='<b>'+n+'</b> 개 현장';
      document.getElementById('noResult').hidden=n>0;
      if(more){more.hidden=n<=show;more.setAttribute('aria-expanded',open);more.textContent=open?'접기 ▴':'전체 '+n+'곳 보기 ▾';}
    }
    if(more) more.addEventListener('click',function(){open=!open;draw()});
    draw();
    fbox.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){cur=b.textContent;fbox.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',x===b)});draw()})});
    q.addEventListener('input',draw);
  }

  // 복사 버튼
  document.querySelectorAll('.copy').forEach(function(b){b.addEventListener('click',function(){
    var t=b.dataset.copy, old=b.textContent;
    function done(){b.textContent='복사됨';setTimeout(function(){b.textContent=old},1500)}
    if(navigator.clipboard) navigator.clipboard.writeText(t).then(done,function(){});
  })});

  // 첨부파일 용량 확인 (Netlify Forms 한도 8MB)
  var f=document.getElementById('f-file');
  if(f) f.addEventListener('change',function(){ if(f.files[0]&&f.files[0].size>8*1024*1024){ f.setCustomValidity('8MB 이하 파일만 첨부할 수 있습니다. 큰 파일은 이메일로 보내 주세요.'); f.reportValidity(); } else f.setCustomValidity(''); });
  // 작업 영상: 화면에 보일 때만 재생, 벗어나면 멈춤 (소리 없음·반복)
  // 아이폰 저전력 모드 등 자동재생이 막히면 같은 장면의 움직이는 이미지(webp)로 바꿔 자동으로 움직이게 함 · 이미지를 누르면 고화질 영상으로 전환 (webp 없으면 재생 버튼 → 터치하면 재생)
  var vids=document.querySelectorAll('video[data-auto]');if(vids.length&&'IntersectionObserver' in window){var swapIn=function(v){var ph=v._ph,im=v._im;if(v.parentNode===ph&&v.paused){ph.replaceChild(im,v);ph.classList.add('hasanim');}};var showImg=function(v){var ph=v._ph,im=v._im;if(im){if(im.complete)swapIn(v);return;}im=v._im=new Image();im.className='vanim';im.alt=v.getAttribute('aria-label')||'';im.onerror=function(){ph.classList.add('vpause')};im.onload=function(){swapIn(v)};im.addEventListener('click',function(){if(im.parentNode===ph){ph.replaceChild(v,im);ph.classList.remove('hasanim');tryPlay(v);}});im.src=v.dataset.anim;};var tryPlay=function(v){v.muted=true;var ph=v._ph,p=v.play();if(p&&p.then)p.then(function(){ph.classList.remove('vpause')},function(){if(v.dataset.anim)showImg(v);else ph.classList.add('vpause')});};var mob=window.matchMedia&&matchMedia('(max-width:760px)').matches;var vo=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target,th=+(v.dataset.th||.25);if(e.isIntersecting&&e.intersectionRatio>=th-.01){if(!v._in){v._in=true;tryPlay(v);}}else if(!e.isIntersecting||e.intersectionRatio<.05){v._in=false;v.pause();}});},{threshold:[0,.05,.25,.55]});[].forEach.call(vids,function(v){v._ph=v.parentNode;if(mob&&v.dataset.m){v.src=v.dataset.m;if(v.dataset.pm)v.poster=v.dataset.pm;if(v.dataset.am)v.dataset.anim=v.dataset.am;v._ph.classList.add('mob');}vo.observe(v);v._ph.addEventListener('click',function(){if(v.parentNode===v._ph)tryPlay(v)});});var wake=function(){[].forEach.call(vids,function(v){if(v._in&&v.paused&&!v.ended&&v.parentNode===v._ph)tryPlay(v)});};document.addEventListener('touchend',wake,{passive:true});document.addEventListener('click',wake);}
  // 하위 메뉴 페이지를 미리 받아두기 → 탭을 누르면 바로 뜨게 (아이폰 사파리 포함)
  var pf={};function pre(h){if(!h||pf[h]||h.charAt(0)!=='/'||h.charAt(1)==='/'||h===location.pathname||/\.(pdf|jpg|png|webp|mp4)$/i.test(h))return;pf[h]=1;try{fetch(h,{credentials:'same-origin'}).catch(function(){});}catch(e){}}
  (window.requestIdleCallback||function(fn){setTimeout(fn,1500)})(function(){[].forEach.call(document.querySelectorAll('.lnb a'),function(a){pre(a.getAttribute('href'))});});
  document.addEventListener('touchstart',function(e){var a=e.target.closest&&e.target.closest('a[href^="/"]');if(a)pre(a.getAttribute('href'));},{passive:true});
})();
