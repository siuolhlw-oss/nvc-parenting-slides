(() => {
  'use strict';
  const slides = window.COURSE.slides;
  const $ = id => document.getElementById(id);
  let current = 0;
  const revealed = new Map();
  const chapterStarts = slides.flatMap((s, i) => i === 0 || s.chapter !== slides[i - 1].chapter ? [{ title: s.chapter, index: i }] : []);
  const initialIndex = () => Math.max(0, Math.min(slides.length - 1, Math.trunc(Number(location.hash.slice(1)) || 1) - 1));
  function render(focus = false) {
    const s = slides[current];
    const count = revealed.get(current) || 0;
    const answers = s.reveal || [];
    const inlineAnswers = s.revealedBodies || s.revealedBody;
    const body = count > 0 ? (s.revealedBodies?.[count - 1] ?? s.revealedBody ?? s.body) : s.body;
    $('slide').className = s.className || '';
    $('slide').innerHTML = `<p class="eyebrow">${s.kicker || s.chapter}</p>${s.cover ? '' : `<h1 id="slide-title">${s.title}</h1>`}${body}${inlineAnswers ? '' : answers.map((html, i) => `<section class="answer" aria-label="參考回應" ${i >= count ? 'hidden' : ''}><p class="reference-label">參考方向 · 回到自己的真實經驗</p>${html}</section>`).join('')}${s.source ? '<span class="source-cue">來源與改寫說明，見講師筆記</span>' : ''}`;
    $('chapter-name').textContent = s.chapter;
    $('counter').textContent = `${String(current + 1).padStart(2, '0')} / ${slides.length}`;
    $('previous').disabled = current === 0;
    $('next').disabled = current === slides.length - 1;
    $('reveal').hidden = count >= answers.length;
    $('reveal').textContent = s.revealLabels?.[count] || s.revealLabel || '揭示參考';
    $('hide-answer').hidden = count === 0;
    $('progress-fill').style.width = `${(current + 1) / slides.length * 100}%`;
    document.title = `${s.title.replace(/<[^>]*>/g, '')}｜把話說進心裡`;
    updateNotes();
    document.querySelectorAll('#chapter-list button').forEach(button => button.setAttribute('aria-current', String(button.dataset.chapter === s.chapter)));
    if (focus) $('slide').focus({ preventScroll: true });
  }
  function go(index) {
    if (index < 0 || index >= slides.length || index === current) return;
    current = index;
    history.replaceState(null, '', `#${current + 1}`);
    render(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function reveal() {
    const total = slides[current].reveal?.length || 0;
    const count = revealed.get(current) || 0;
    if (count >= total) return;
    revealed.set(current, count + 1);
    render();
    // Revealing a response never changes the slide.
    if ($('reveal').hidden) $('hide-answer').focus({ preventScroll: true });
  }
  function updateNotes() {
    const s = slides[current];
    $('notes-content').replaceChildren();
    const main = document.createElement('p');
    main.textContent = s.notes || '讓聽眾有時間思考與回應，依現場節奏換頁。';
    $('notes-content').append(main);
    if (s.source) { const source = document.createElement('p'); source.className = 'note-source'; source.textContent = `來源：${s.source}。`; $('notes-content').append(source); }
  }
  $('previous').addEventListener('click', () => go(current - 1));
  $('next').addEventListener('click', () => go(current + 1));
  $('reveal').addEventListener('click', reveal);
  $('hide-answer').addEventListener('click', () => { revealed.delete(current); render(); $('reveal').focus({ preventScroll: true }); });
  $('chapters-button').addEventListener('click', () => $('chapters-dialog').showModal());
  $('notes-button').addEventListener('click', () => $('notes-dialog').showModal());
  document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } }));
  chapterStarts.forEach(({ title, index }) => {
    const button = document.createElement('button'); button.dataset.chapter = title;
    const page = document.createElement('span'); page.textContent = `第 ${index + 1} 頁`;
    button.append(page, document.createTextNode(title));
    button.addEventListener('click', () => { $('chapters-dialog').close(); go(index); });
    $('chapter-list').append(button);
  });
  $('fullscreen-button').addEventListener('click', async () => {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }
    catch { $('fullscreen-button').textContent = '請按 F11'; }
  });
  document.addEventListener('fullscreenchange', () => { $('fullscreen-button').textContent = document.fullscreenElement ? '離開全螢幕' : '全螢幕'; });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || document.querySelector('dialog[open]') || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    if (['ArrowRight', 'PageDown'].includes(event.key)) { event.preventDefault(); go(current + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); go(current - 1); }
    else if (event.key === 'Home') { event.preventDefault(); go(0); }
    else if (event.key === 'End') { event.preventDefault(); go(slides.length - 1); }
    else if (event.code === 'Space' && event.target.tagName !== 'BUTTON' && event.target.tagName !== 'A') { event.preventDefault(); reveal(); }
  });
  window.addEventListener('hashchange', () => { current = initialIndex(); render(true); window.scrollTo({ top: 0, behavior: 'instant' }); });
  current = initialIndex();
  render();
})();
