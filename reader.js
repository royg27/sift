(function () {
  'use strict';
  var activeId = null, index = 0, activeIdea = null, options = {};
  var revealed = {}, selected = {};
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var allowed = new Set(['P','B','STRONG','EM','I','UL','OL','LI','H3','H4','BLOCKQUOTE','BR','CODE','SMALL']);
  function sanitize(html) {
    var template = document.createElement('template');
    template.innerHTML = String(html || '');
    function walk(node) {
      if (node.nodeType === 3) return esc(node.textContent);
      if (node.nodeType !== 1) return '';
      if (['SCRIPT','STYLE','IFRAME','OBJECT','SVG','MATH','FORM','TEMPLATE','INPUT','BUTTON','VIDEO','AUDIO','IMG','LINK'].includes(node.tagName)) return '';
      var content = Array.from(node.childNodes).map(walk).join('');
      if (!allowed.has(node.tagName)) return content;
      var tag = node.tagName.toLowerCase();
      return tag === 'br' ? '<br>' : '<' + tag + '>' + content + '</' + tag + '>';
    }
    return Array.from(template.content.childNodes).map(walk).join('');
  }
  function basicSlides(idea) {
    var ps = Array.isArray(idea.body) ? idea.body : [];
    return [
      {kind:'cover', eyebrow:'THE BIG IDEA', title:idea.title, html:'<p>' + esc(idea.hook) + '</p>'},
      {kind:'story', eyebrow:'THE CONTEXT', title:'Why this matters', html:'<p>' + esc(ps[0] || idea.summary) + '</p>'},
      {kind:'visual', eyebrow:'THE MECHANISM', title:'What to remember', html:'<p>' + esc(ps[1] || idea.summary) + '</p>',
       visual:{type:'steps', items:(idea.takeaways || []).slice(0,3).map(function(t, i){return {label:'0' + (i+1),text:t};})}},
      {kind:'story', eyebrow:'THE IMPLICATION', title:'Look at it differently', html:'<p>' + esc(ps[2] || idea.summary) + '</p>'},
      {kind:'interactive', eyebrow:'TRY IT', title:'Put the idea to work', html:'<p>' + esc(idea.application) + '</p>',
       interaction:{type:'reveal', prompt:'What should you keep in mind?', answer:idea.nuance}}
    ];
  }
  function slidesFor(idea) {
    var slides = Array.isArray(idea.slides) && idea.slides.length >= 3 ? idea.slides : basicSlides(idea);
    return slides.slice(0,8).concat([{kind:'recall', eyebrow:'ONE-MINUTE RECALL', title:'Make it stick', html:''}]);
  }
  function visualHtml(v) {
    if (!v || typeof v !== 'object') return '';
    var type = v.type;
    if (type === 'compare') {
      return '<div class="sift-compare">' + [v.left,v.right].filter(Boolean).map(function(c,i){
        return '<div class="sift-compare-item ' + (i?'right':'left') + '"><span>' + esc(c.label || (i?'B':'A')) +
          '</span><strong>' + esc(c.title) + '</strong><p>' + esc(c.text) + '</p></div>';
      }).join('') + '</div>';
    }
    if (type === 'steps' || type === 'flow') {
      return '<div class="sift-' + type + '">' + (v.items || []).slice(0,4).map(function(c,i) {
        return '<div class="sift-step"><span class="sift-step-num">' + esc(c.label || String(i+1).padStart(2,'0')) +
          '</span><div><strong>' + esc(c.title || c.text) + '</strong>' + (c.title && c.text ? '<p>' + esc(c.text) + '</p>':'') +
          '</div></div>';
      }).join('') + '</div>';
    }
    if (type === 'cards') {
      return '<div class="sift-microcards">' + (v.items || []).slice(0,3).map(function(c) {
        return '<div class="sift-microcard"><span>' + esc(c.label || '') + '</span><strong>' + esc(c.title || '') +
          '</strong><p>' + esc(c.text || '') + '</p></div>';
      }).join('') + '</div>';
    }
    return '';
  }
  function interactionHtml(v, key) {
    if (!v || typeof v !== 'object') return '';
    if (v.type === 'reveal') {
      return '<div class="sift-interact"><p class="sift-interact-label">THINK ABOUT IT</p><strong>' +
        esc(v.prompt || 'What do you think?') + '</strong>' +
        (revealed[key] ? '<div class="sift-answer">' + esc(v.answer || '') + '</div>' :
        '<button class="sift-reveal-btn" data-sift-reveal="1">Reveal insight ↗</button>') + '</div>';
    }
    if (v.type === 'choice') {
      var pick=selected[key];
      return '<div class="sift-interact"><p class="sift-interact-label">MAKE A CHOICE</p><strong>' +
        esc(v.question) + '</strong><div class="sift-choices">' +
        (v.choices||[]).slice(0,4).map(function(c,i){
          return '<button class="sift-choice ' + (pick===i?'active':'') + '" data-sift-choice="' + i +
            '" aria-pressed="' + (pick===i) + '">' + esc(c) + '</button>';
        }).join('') + '</div>' + (pick!==undefined ? '<div class="sift-answer">' + esc(v.feedback || '') + '</div>' : '') + '</div>';
    }
    return '';
  }
  function quizHtml(idea) {
    var quiz=idea.quiz || {}, answered=options.quiz;
    return '<div class="sift-quiz-box"><p class="sift-interact-label">TEST YOURSELF</p><h3>' + esc(quiz.question) + '</h3>' +
      (quiz.choices||[]).map(function(c,i) {
        var cls=answered === undefined ? '' : (i===quiz.answer?' correct':i===answered?' incorrect':'');
        return '<button data-quiz="' + esc(idea.id) + '" data-choice="' + i + '" class="quiz-choice' + cls +
          '" ' + (answered===undefined?'':'disabled') + '>' + esc(c) + '</button>';
      }).join('') + (answered===undefined?'':'<p class="sift-quiz-feedback">' + esc(quiz.explanation) + '</p>') +
      '</div><div class="sift-reader-footer"><a href="' + esc(idea.source_url && /^https:\/\//i.test(idea.source_url) ? idea.source_url : '#') +
      '" target="_blank" rel="noopener noreferrer">Read the original source ↗</a><div class="sift-finish-actions">' +
      '<button data-read="' + esc(idea.id) + '" class="sift-complete">' + (options.read?'✓ Completed':'✓ Mark as read') + '</button>' +
      '<button data-save="' + esc(idea.id) + '" class="sift-keep">' + (options.saved?'★ Saved':'☆ Save') + '</button></div></div>';
  }
  function render() {
    if (!activeIdea) return;
    var slides = slidesFor(activeIdea);
    index = Math.min(Math.max(index,0),slides.length-1);
    var slide = slides[index], isLast=slide.kind==='recall', key=activeId + ':' + index;
    var label=(index+1) + ' / ' + slides.length;
    var dots=slides.map(function(_,i){return '<button type="button" class="sift-progress-segment ' +
      (i<=index?'filled':'')+'" data-sift-goto="'+i+'" aria-label="Go to slide '+(i+1)+'" aria-current="'+(i===index?'step':'false')+'"></button>';}).join('');
    document.getElementById('modal-root').innerHTML =
      '<div class="modal-backdrop sift-reader-backdrop" id="backdrop">' +
      '<section class="sift-reader" role="dialog" aria-modal="true" aria-label="' + esc(activeIdea.title) + '">' +
      '<header class="sift-reader-header"><div class="sift-reader-brand"><span class="sift-reader-mark">✳</span> sift <span class="sift-story-category">' +
      esc(activeIdea.type) + ' · ' + esc(activeIdea.category) + '</span></div>' +
      '<button class="sift-close" aria-label="Close story" data-close="true">×</button></header>' +
      '<div class="sift-progress" aria-label="Slide progress">' + dots + '</div>' +
      '<div class="sift-slide-scroll"><article class="sift-slide sift-slide-' + esc(slide.kind||'story') + '" aria-live="polite">' +
      '<p class="sift-slide-overline">' + esc(slide.eyebrow||activeIdea.type) + '</p>' +
      '<h2 id="modal-title">' + esc(slide.title||activeIdea.title) + '</h2>' +
      '<div class="sift-slide-copy">' + sanitize(slide.html||'') + '</div>' +
      (isLast?quizHtml(activeIdea):visualHtml(slide.visual)+interactionHtml(slide.interaction,key)) +
      '</article></div>' +
      '<footer class="sift-reader-nav"><span class="sift-slide-counter">' + label + '</span>' +
      '<div class="sift-reader-controls"><button data-sift-prev="1" aria-label="Previous slide" ' +
      (index===0?'disabled':'') + '>←</button>' +
      '<button class="sift-next" data-sift-next="1">' + (index===slides.length-1?'Close':'Next →') + '</button></div></footer>' +
      '</section></div>';
  }
  function open(idea, opts) {
    if (!idea) return;
    if (activeId!==idea.id) { activeId=idea.id; index=0; }
    activeIdea=idea; options=opts||{}; render();
  }
  function step(n) { var slides=slidesFor(activeIdea);if(n>=slides.length){var close=document.querySelector('.sift-close');if(close)close.click();return;}index=Math.max(0,Math.min(slides.length-1,n));render();}
  document.addEventListener('click',function(e){
    if (!activeIdea || !document.getElementById('backdrop')) return;
    var button=e.target.closest('[data-sift-next],[data-sift-prev],[data-sift-goto],[data-sift-reveal],[data-sift-choice]');
    if (!button) return;
    if (button.hasAttribute('data-sift-next')) step(index+1);
    else if (button.hasAttribute('data-sift-prev')) step(index-1);
    else if (button.hasAttribute('data-sift-goto')) step(Number(button.dataset.siftGoto));
    else if (button.hasAttribute('data-sift-reveal')) {revealed[activeId+':'+index]=true;render();}
    else if (button.hasAttribute('data-sift-choice')) {selected[activeId+':'+index]=Number(button.dataset.siftChoice);render();}
  });
  window.addEventListener('keydown',function(e){
    if (!activeIdea || !document.getElementById('backdrop')) return;
    if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
    if(e.key==='ArrowRight'){e.preventDefault();step(index+1);}
    else if(e.key==='ArrowLeft'){e.preventDefault();step(index-1);}
  });
  var touchX=0,touchY=0;
  document.addEventListener('touchstart',function(e){
    if (!e.target.closest('.sift-reader')) return;
    touchX=e.changedTouches[0].screenX;touchY=e.changedTouches[0].screenY;
  },{passive:true});
  document.addEventListener('touchend',function(e){
    if (!e.target.closest('.sift-reader')||!touchX) return;
    var dx=e.changedTouches[0].screenX-touchX,dy=e.changedTouches[0].screenY-touchY;
    touchX=0;
    if(Math.abs(dx)>65 && Math.abs(dx)>Math.abs(dy)*1.4)step(index+(dx<0?1:-1));
  },{passive:true});
  window.SIFT_SLIDES = {open:open, refresh:open, close:function(){activeId=null;activeIdea=null;index=0;}};
})();