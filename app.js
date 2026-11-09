'use strict';
(() => {
  const data = window.PHYSOPSD_MEDIA;
  if (!data) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(navigator.connection?.saveData);
  const groups = new Set();
  const esc = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

  function videoMarkup(media, label) {
    return `<div class="video-frame"><video data-src="${esc(media.src)}" poster="${esc(media.poster)}" preload="none" muted loop playsinline aria-label="${esc(label)}"></video><button class="full-button" aria-label="View ${esc(label)} fullscreen" title="Fullscreen">⛶</button></div>`;
  }

  class MediaGroup {
    constructor(element, {sync = true, controls = true} = {}) {
      this.element = element;
      this.videos = [...element.querySelectorAll('video')];
      this.sync = sync;
      this.visible = false;
      this.manualPause = reducedMotion || saveData;
      this.playing = false;
      this.disposed = false;
      this.request = 0;
      this.progress = element.querySelector('.pair-progress');
      this.button = element.querySelector('.play-button');
      this.button?.addEventListener('click', () => this.toggle());
      element.querySelector('.replay-button')?.addEventListener('click', () => this.replay());
      this.progress?.addEventListener('input', () => {
        const fraction = Number(this.progress.value) / 1000;
        this.videos.forEach(video => { if (Number.isFinite(video.duration)) video.currentTime = fraction * video.duration; });
      });
      this.videos.forEach(video => {
        video.muted = true;
        video.addEventListener('click', () => this.toggle());
        video.addEventListener('error', () => {
          if (this.disposed || !video.getAttribute('src')) return;
          this.pause();
          const frame = video.closest('.video-frame');
          if (!frame.querySelector('.video-error')) {
            const error = document.createElement('div');
            error.className = 'video-error';
            error.innerHTML = `Unable to play this clip. <a href="${esc(video.dataset.src)}" target="_blank" rel="noopener">Open video ↗</a>`;
            frame.append(error);
          }
        });
        const full = video.parentElement.querySelector('.full-button');
        full?.addEventListener('click', () => {
          if (video.parentElement.requestFullscreen) video.parentElement.requestFullscreen().catch(() => {});
          else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
          else window.open(video.dataset.src, '_blank', 'noopener');
        });
      });
      this.videos[0]?.addEventListener('timeupdate', () => {
        const first = this.videos[0];
        if (!Number.isFinite(first.duration) || !first.duration) return;
        if (this.progress) this.progress.value = String(first.currentTime / first.duration * 1000);
        if (this.sync && this.playing) {
          this.videos.slice(1).forEach(video => {
            if (video.readyState >= 2 && Math.abs(video.currentTime - first.currentTime) > .16) {
              video.currentTime = Math.min(first.currentTime, Math.max(0, video.duration - .04));
            }
          });
        }
      });
      this.observer = new IntersectionObserver(entries => {
        this.visible = entries[0].isIntersecting;
        if (this.visible && !this.manualPause && !document.hidden) this.play();
        else if (!this.visible) this.pause();
      }, {threshold: .15});
      this.observer.observe(element);
      groups.add(this);
      this.updateButton();
    }
    load() {
      this.videos.forEach(video => {
        if (!video.getAttribute('src')) {
          video.src = video.dataset.src;
          video.load();
        }
      });
    }
    updateButton() {
      if (this.button) {
        this.button.textContent = this.playing ? 'Ⅱ Pause' : '▷ Play';
        this.button.setAttribute('aria-label', `${this.playing ? 'Pause' : 'Play'} ${this.videos.length === 1 ? 'promo video' : this.sync ? 'both videos' : 'case study videos'}`);
      }
      this.element.dispatchEvent(new CustomEvent('groupstate', {detail: this.playing}));
    }
    async play() {
      if (this.disposed || document.hidden) return;
      const request = ++this.request;
      this.load();
      // Resolve readiness for the complete pair before starting either side.
      const readiness = this.videos.map(video => video.readyState >= 3 ? Promise.resolve() : new Promise(resolve => {
        const done = () => {video.removeEventListener('canplay', done); video.removeEventListener('error', done); resolve();};
        video.addEventListener('canplay', done, {once:true});
        video.addEventListener('error', done, {once:true});
      }));
      await Promise.all(readiness);
      if (this.disposed || request !== this.request || !this.visible || document.hidden) return;
      if (this.videos.some(video => video.error)) return;
      if (this.sync) this.videos.slice(1).forEach(video => { video.currentTime = this.videos[0].currentTime; });
      this.playing = true;
      this.updateButton();
      const results = await Promise.allSettled(this.videos.map(video => video.play()));
      if (request === this.request && results.some(result => result.status === 'rejected')) this.pause();
    }
    pause() {
      this.request++;
      this.playing = false;
      this.videos.forEach(video => video.pause());
      this.updateButton();
    }
    toggle() {
      if (this.playing) { this.manualPause = true; this.pause(); }
      else { this.manualPause = false; this.play(); }
    }
    replay() {
      this.manualPause = false;
      this.videos.forEach(video => { if (video.readyState) video.currentTime = 0; });
      this.play();
    }
    dispose() {
      this.disposed = true;
      this.pause();
      this.observer.disconnect();
      this.videos.forEach(video => { video.removeAttribute('src'); video.load(); });
      groups.delete(this);
    }
  }
  document.addEventListener('visibilitychange', () => {
    groups.forEach(group => {
      if (document.hidden) group.pause();
      else if (group.visible && !group.manualPause) group.play();
    });
  });

  function pairMarkup(item) {
    return `<div class="pair-media"><div class="video-column"><p class="video-label">Base Model<span class="label-line"></span></p>${videoMarkup(item.base, `Base Model: ${item.title}`)}</div><div class="video-column ours"><p class="video-label">+PhysOPSD<span class="label-line"></span></p>${videoMarkup(item.ours, `PhysOPSD: ${item.title}`)}</div></div><div class="pair-controls"><button class="play-button" aria-label="Play both videos">▷ Play</button><input type="range" class="pair-progress" min="0" max="1000" value="0" aria-label="Seek both videos"><button class="replay-button" aria-label="Replay both videos" title="Replay">↻</button></div>`;
  }

  new MediaGroup($('#promo-player'), {sync:false});

  const categories = ['All', 'Contact', 'Motion', 'Materials', 'Fluids', 'Optics'];
  let category = 'All', page = 0, galleryGroups = [];
  const perPage = 6;
  $('#filters').innerHTML = categories.map(name => `<button data-filter="${name}" aria-pressed="${name === category}">${name}</button>`).join('');
  function renderGallery() {
    galleryGroups.forEach(group => group.dispose());
    const items = data.comparisons.filter(item => category === 'All' || item.category === category);
    const visible = items.slice(page * perPage, (page + 1) * perPage);
    $('#comparison-grid').innerHTML = visible.map(item => `<article class="comparison-card" aria-label="${esc(item.title)}"><div class="pair-player">${pairMarkup(item)}</div><details class="prompt"><summary>View prompt</summary>${item.displayPrompt ? `<p class="prompt-label">Scene description · edited for display</p><p>${esc(item.displayPrompt)}</p><details class="original-prompt"><summary>Original generation prompt</summary><p>${esc(item.prompt)}</p></details>` : `<p>${esc(item.prompt)}</p>`}</details></article>`).join('');
    galleryGroups = [...document.querySelectorAll('#comparison-grid .pair-player')].map(element => new MediaGroup(element));
    $('#comparison-count').textContent = `${page * perPage + 1}–${Math.min((page + 1) * perPage, items.length)} of ${items.length} comparisons`;
    $('#page-count').textContent = `${String(page + 1).padStart(2, '0')} / ${String(Math.ceil(items.length / perPage)).padStart(2, '0')}`;
    $('#previous-page').disabled = page === 0;
    $('#next-page').disabled = (page + 1) * perPage >= items.length;
    document.querySelectorAll('#filters button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
  }
  $('#filters').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    category = button.dataset.filter; page = 0; renderGallery();
  });
  function changePage(delta) {
    page += delta; renderGallery();
    $('#comparison-grid').scrollIntoView({behavior: reducedMotion ? 'instant' : 'smooth', block:'start'});
  }
  $('#previous-page').addEventListener('click', () => changePage(-1));
  $('#next-page').addEventListener('click', () => changePage(1));
  renderGallery();

  let studyIndex = 0, level = 'dense', studyGroup;
  $('#study-tabs').innerHTML = data.studies.map((item, index) => `<button id="tab-${item.id}" role="tab" aria-controls="study-panel" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-index="${index}">${esc(item.title)}</button>`).join('');
  function renderStudy() {
    studyGroup?.dispose();
    const item = data.studies[studyIndex];
    const panel = $('#study-panel');
    panel.setAttribute('aria-labelledby', `tab-${item.id}`);
    [...$('#study-tabs').children].forEach((button, index) => {
      button.setAttribute('aria-selected', String(index === studyIndex));
      button.tabIndex = index === studyIndex ? 0 : -1;
    });
    panel.innerHTML = `<div class="study-topbar"><div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></div><div class="segmented" role="group" aria-label="Physical draft detail"><button data-level="dense" aria-pressed="${level === 'dense'}">Dense draft</button><button data-level="abstract" aria-pressed="${level === 'abstract'}">Abstract draft</button></div></div><div class="study-workspace"><aside class="reference-box"><p class="video-label">Reference<span class="label-line"></span></p>${videoMarkup(item.media.reference, `${item.title}: reference`)}<p class="reference-caption">Real-world scene context</p><div class="parameter-card"><p class="eyebrow">Controlled variation</p><h4>${esc(item.parameter)}</h4><div class="parameter-values"><span>${esc(item.values[0])}</span><span aria-hidden="true">→</span><span>${esc(item.values[1])}</span></div></div></aside><div class="study-matrix"><p class="matrix-heading">${level === 'dense' ? 'Dense' : 'Abstract'} physical draft</p><p class="matrix-heading output">Self-teacher generation</p>${['minus','plus'].map((side, i) => ['draft','teacher'].map(type => `<div class="study-item">${videoMarkup(item.media[`${type}-${side}-${level}`], `${item.title}: ${item.labels[i]}, ${type}`)}<p>${esc(item.labels[i])}<span>${esc(item.values[i])}</span></p></div>`).join('')).join('')}</div></div><div class="study-actions"><span>Same scene · Two physical conditions</span><div><button class="study-pause">Play all</button><button class="study-replay">Replay ↻</button></div></div>`;
    studyGroup = new MediaGroup(panel, {sync:false, controls:false});
    panel.addEventListener('groupstate', event => {
      const button = $('.study-pause', panel);
      if (button) button.textContent = event.detail ? 'Pause all' : 'Play all';
    }, {signal: studyListener.signal});
    $('.study-pause', panel).addEventListener('click', () => studyGroup.toggle());
    $('.study-replay', panel).addEventListener('click', () => studyGroup.replay());
  }
  let studyListener = new AbortController();
  function updateStudy() { studyListener.abort(); studyListener = new AbortController(); renderStudy(); }
  $('#study-tabs').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button) { studyIndex = Number(button.dataset.index); updateStudy(); }
  });
  $('#study-tabs').addEventListener('keydown', event => {
    if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') studyIndex = 0;
    else if (event.key === 'End') studyIndex = data.studies.length - 1;
    else studyIndex = (studyIndex + (event.key === 'ArrowRight' ? 1 : -1) + data.studies.length) % data.studies.length;
    updateStudy();
    $('#study-tabs').children[studyIndex].focus();
  });
  $('#study-panel').addEventListener('click', event => {
    const button = event.target.closest('[data-level]');
    if (button) { level = button.dataset.level; updateStudy(); $(`[data-level="${level}"]`).focus({preventScroll:true}); }
  });
  renderStudy();
})();
