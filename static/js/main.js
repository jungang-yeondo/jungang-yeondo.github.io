(function(){
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
    function draw(){
      var k=q.value.trim().toLowerCase(), n=0;
      rows.forEach(function(r){var ok=(cur==='전체'||r.dataset.cat===cur)&&(!k||r.textContent.toLowerCase().indexOf(k)>-1);r.hidden=!ok;if(ok)n++});
      document.getElementById('countLine').innerHTML='<b>'+n+'</b> 개 현장';
      document.getElementById('noResult').hidden=n>0;
    }
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
})();
