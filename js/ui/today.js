import { h, clear } from '../dom.js';
import { dueIds, newIds } from '../review.js';
import { pickDay, taskIds } from '../plan.js';

let dayIx = null;

export async function render(ctx, el) {
  const [week, cards] = await Promise.all([ctx.load('content/week.json'), ctx.load('content/cards.json')]);
  const s = ctx.state;
  const due = dueIds(s, cards).length, fresh = newIds(s, cards).length;
  el.append(h('p', { class: 'label' }, `Week ${week.n} of 22 · ${week.dates}`), h('h1', {}, 'This week'));
  if (!week.days.length) {
    el.append(h('div', { class: 'card empty' }, 'No sessions in this week\'s plan yet.'));
  } else {
    if (dayIx === null || dayIx >= week.days.length) dayIx = pickDay(week.days);
    const ids = taskIds(week);
    const done = () => ids.filter((id) => ctx.state.tasks[id]).length;
    const progressText = h('strong', {}), progressPct = h('span', { class: 'small muted' }), bar = h('i', { style: 'width:0;background:var(--accent)' });
    const paint = () => {
      progressText.textContent = `${done()} of ${ids.length} steps done`;
      progressPct.textContent = `${Math.round((100 * done()) / ids.length)}%`;
      bar.style.width = `${(100 * done()) / ids.length}%`;
    };
    paint();
    el.append(h('div', { class: 'card', style: 'margin-top:10px' },
      h('div', { class: 'row' }, h('div', { class: 'grow' }, progressText, h('div', { class: 'small muted' }, 'Reading, videos and drills from the ML sessions')), progressPct),
      h('div', { class: 'bar', style: 'margin-top:10px' }, bar)));
    el.append(h('a', { class: 'card', href: '#/review', style: 'display:block;text-decoration:none;color:inherit;margin-top:10px' },
      h('div', { class: 'row' }, h('div', { class: 'grow' }, h('strong', {}, due + fresh ? `${due} due, ${fresh} new cards` : 'No cards due'), h('div', { class: 'small muted' }, 'Questions, terms and formulas from your notes')), h('span', { class: 'pill next' }, 'Review'))));
    const chips = h('div', { class: 'chips', style: 'margin:16px 0 4px' });
    const body = h('div', { class: 'plan card' });
    const showDay = () => {
      chips.replaceChildren(...week.days.map((d, i) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(i === dayIx), onClick: () => { dayIx = i; showDay(); } }, d.label)));
      body.innerHTML = week.days[dayIx].html;
      for (const li of body.querySelectorAll('li.task')) {
        const id = li.dataset.task, box = li.querySelector('.check');
        const sync = () => { const on = !!ctx.state.tasks[id]; box.setAttribute('aria-checked', String(on)); box.textContent = on ? '✓' : ''; li.classList.toggle('done', on); };
        sync();
        box.addEventListener('click', () => { ctx.update((st) => { const tasks = { ...st.tasks }; if (tasks[id]) delete tasks[id]; else tasks[id] = true; return { ...st, tasks }; }); sync(); paint(); });
      }
    };
    showDay();
    el.append(chips, body);
    if (week.introHtml) el.append(h('details', { class: 'card', style: 'margin-top:12px' }, h('summary', {}, 'About this week\'s videos'), h('p', { html: week.introHtml })));
    el.append(h('details', { class: 'card', style: 'margin-top:12px' }, h('summary', {}, 'This week is done when'), h('div', { class: 'plan', html: week.doneHtml })));
  }
}
