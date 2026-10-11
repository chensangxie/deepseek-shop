/* ==========================================================================
   云间 YUNJIAN · 首页交互
   1. 工具函数            5. 菜单标签页
   2. 页头 / 移动导航      6. 滚动监听高亮
   3. 滚动入场动画         7. 营业状态
   4. 回到顶部             8. 订座表单
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------ 1. 工具函数 ---------------------------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------ 2. 页头 / 移动导航 --------------------- */
  const header = $('#siteHeader');
  const nav = $('#primaryNav');
  const navToggle = $('#navToggle');

  const onScrollHeader = () => {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 24);
  };
  onScrollHeader();

  const closeNav = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', '打开导航菜单');
    document.body.style.removeProperty('overflow');
  };

  const openNav = () => {
    if (!nav || !navToggle) return;
    nav.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', '关闭导航菜单');
    document.body.style.overflow = 'hidden';
  };

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      if (navToggle.getAttribute('aria-expanded') === 'true') closeNav();
      else openNav();
    });
  }

  // 点击导航链接后关闭抽屉
  $$('.nav a').forEach((a) => a.addEventListener('click', closeNav));

  // Esc 关闭，点击遮罩区域关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });
  document.addEventListener('click', (e) => {
    if (!nav || !nav.classList.contains('is-open')) return;
    if (!nav.contains(e.target) && !navToggle.contains(e.target)) closeNav();
  });

  // 视口变宽时复位抽屉状态
  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) closeNav();
  });

  /* ------------------------------ 3. 滚动入场动画 ------------------------ */
  const revealItems = $$('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealItems.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // 同一父容器内做错峰动画
        const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal'));
        const index = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(index * 90, 360) + 'ms';
        el.classList.add('is-visible');
        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach((el) => io.observe(el));
  }

  /* ------------------------------ 4. 回到顶部 ---------------------------- */
  const toTop = $('#toTop');
  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------ 5. 菜单标签页 -------------------------- */
  const tabs = $$('.tab');
  const panels = $$('.tab-panel');

  const activateTab = (tab) => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
    });
    panels.forEach((p) => {
      const active = p.id === tab.getAttribute('aria-controls');
      p.classList.toggle('is-active', active);
      p.hidden = !active;
    });
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (!next) return;
      e.preventDefault();
      activateTab(next);
      next.focus();
    });
  });

  /* ------------------------------ 6. 滚动监听高亮 ------------------------ */
  const navLinks = $$('.nav-link');
  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute('href');
      return id && id.startsWith('#') ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        navLinks.forEach((link) => link.classList.toggle('is-current', link.getAttribute('href') === id));
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach((s) => spy.observe(s));
  }

  /* ------------------------------ 7. 营业状态 ---------------------------- */
  // 周一(1)–周四(4): 11:30–14:00 / 17:00–22:00
  // 周五(5)–周六(6): 11:30–14:30 / 17:00–23:00
  // 周日(0):         11:30–14:30 / 17:00–21:30
  const HOURS = {
    0: [[11.5, 14.5], [17, 21.5]],
    1: [[11.5, 14], [17, 22]],
    2: [[11.5, 14], [17, 22]],
    3: [[11.5, 14], [17, 22]],
    4: [[11.5, 14], [17, 22]],
    5: [[11.5, 14.5], [17, 23]],
    6: [[11.5, 14.5], [17, 23]]
  };
  const fmt = (n) => {
    const h = Math.floor(n);
    const m = Math.round((n - h) * 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  };

  const renderOpenState = () => {
    const stateEl = $('#openState');
    const detailEl = $('#openStateDetail');
    const pulse = $('.pulse');
    const now = new Date();
    const today = HOURS[now.getDay()] || [];
    const t = now.getHours() + now.getMinutes() / 60;

    let text = '今日已打烊';
    let closed = true;
    let detail = '今日营业时间：' + today.map(([a, b]) => fmt(a) + '–' + fmt(b)).join(' · ');

    for (const [open, close] of today) {
      if (t >= open && t < close) {
        text = '今日营业中 · 到 ' + fmt(close);
        closed = false;
        break;
      }
    }
    if (closed) {
      const next = today.find(([open]) => t < open);
      if (next) text = '今日 ' + fmt(next[0]) + ' 开始营业';
    }

    if (stateEl) stateEl.textContent = text;
    if (detailEl) detailEl.textContent = closed ? text + '（' + detail + '）' : '现在正在营业，欢迎光临。';
    if (pulse) pulse.classList.toggle('is-closed', closed);
  };
  renderOpenState();
  window.setInterval(renderOpenState, 60000);

  /* ------------------------------ 8. 订座表单 ---------------------------- */
  const form = $('#reserveForm');
  const success = $('#reserveSuccess');
  const summary = $('#successSummary');
  const again = $('#reserveAgain');
  const dateInput = $('#rDate');
  const phoneInput = $('#rPhone');
  const nameInput = $('#rName');
  const timeInput = $('#rTime');
  const guestsInput = $('#rGuests');
  const agreeInput = $('#rAgree');

  // 日期最小值 = 今天（本地时间）
  if (dateInput) {
    const d = new Date();
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateInput.min = iso;
    dateInput.value = iso;
  }

  // 座位偏好 chips
  const chipGroup = $('#rAreaGroup');
  const areaInput = $('#rArea');
  if (chipGroup && areaInput) {
    $$('.chip', chipGroup).forEach((chip) => {
      chip.addEventListener('click', () => {
        $$('.chip', chipGroup).forEach((c) => {
          const active = c === chip;
          c.classList.toggle('is-active', active);
          c.setAttribute('aria-checked', String(active));
        });
        areaInput.value = chip.dataset.value || '不限';
      });
    });
  }

  const setError = (input, message) => {
    if (!input) return;
    const field = input.closest('.field');
    const err = $('#err-' + input.id);
    if (field) field.classList.toggle('has-error', Boolean(message));
    if (err) err.textContent = message || '';
  };

  // 每条规则返回 [控件, 错误文案]，文案为空表示通过
  const validators = [
    () => {
      if (!dateInput.value) return [dateInput, '请选择就餐日期'];
      if (dateInput.value < dateInput.min) return [dateInput, '日期不能早于今天'];
      return [dateInput, ''];
    },
    () => (timeInput.value ? [timeInput, ''] : [timeInput, '请选择到店时间']),
    () => (guestsInput.value ? [guestsInput, ''] : [guestsInput, '请选择用餐人数']),
    () => {
      const v = nameInput.value.trim();
      if (!v) return [nameInput, '请填写您的称呼'];
      if (v.length < 2) return [nameInput, '称呼至少 2 个字符'];
      return [nameInput, ''];
    },
    () => {
      const v = phoneInput.value.replace(/[\s-]/g, '');
      if (!v) return [phoneInput, '请填写手机号'];
      if (!/^1[3-9]\d{9}$/.test(v)) return [phoneInput, '请填写有效的 11 位手机号'];
      return [phoneInput, ''];
    },
    () => (agreeInput.checked ? [agreeInput, ''] : [agreeInput, '请先同意订座须知'])
  ];

  // 实时清除错误
  [dateInput, timeInput, guestsInput, nameInput, phoneInput, agreeInput].forEach((el) => {
    if (!el) return;
    const evt = el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'date' ? 'change' : 'input';
    el.addEventListener(evt, () => setError(el, ''));
  });

  const formatDate = (value) => {
    if (!value) return '—';
    const [y, m, d] = value.split('-');
    const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(value + 'T00:00:00').getDay()];
    return `${y} 年 ${Number(m)} 月 ${Number(d)} 日（${week}）`;
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let firstInvalid = null;

      validators.forEach((validate) => {
        const [input, message] = validate();
        setError(input, message);
        if (message && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
        return;
      }

      const submitBtn = $('#reserveSubmit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '提交中…';
      }

      // 演示：模拟一次网络请求
      window.setTimeout(() => {
        if (summary) {
          summary.innerHTML =
            `<b>${nameInput.value.trim()}</b> · ${phoneInput.value.replace(/[\s-]/g, '')}<br>` +
            `时间：${formatDate(dateInput.value)} ${timeInput.value}<br>` +
            `人数：${guestsInput.value} · 座位：${areaInput.value}`;
        }
        form.hidden = true;
        if (success) {
          success.hidden = false;
          success.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '提交预订';
        }
      }, 650);
    });
  }

  if (again) {
    again.addEventListener('click', () => {
      if (!form) return;
      form.reset();
      if (dateInput) {
        const d = new Date();
        dateInput.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      }
      if (areaInput) areaInput.value = '不限';
      if (chipGroup) {
        $$('.chip', chipGroup).forEach((c, i) => {
          c.classList.toggle('is-active', i === 0);
          c.setAttribute('aria-checked', String(i === 0));
        });
      }
      $$('.field.has-error').forEach((f) => f.classList.remove('has-error'));
      $$('.error').forEach((el) => { el.textContent = ''; });
      if (success) success.hidden = true;
      form.hidden = false;
      form.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
      if (nameInput) nameInput.focus({ preventScroll: true });
    });
  }

  /* ------------------------------ 页脚年份 ------------------------------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------ 滚动节流绑定 --------------------------- */
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      onScrollHeader();
      if (toTop) toTop.classList.toggle('is-shown', window.scrollY > 640);
      ticking = false;
    });
  }, { passive: true });
})();
