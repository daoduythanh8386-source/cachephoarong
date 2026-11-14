/* Phát hiện trình duyệt bên trong ứng dụng (Zalo, Facebook, Messenger, Instagram, TikTok, Line…)
   – các trình duyệt này thường chặn nhận dạng giọng nói → hướng dẫn mở bằng Safari/Chrome. */
(function () {
  'use strict';
  const ua = navigator.userAgent || '';
  const APPS = [
    [/Zalo/i, 'Zalo'], [/FBAN|FBAV|FB_IAB|FBIOS/i, 'Facebook'], [/Messenger/i, 'Messenger'],
    [/Instagram/i, 'Instagram'], [/musical_ly|TikTok|BytedanceWebview/i, 'TikTok'], [/\bLine\//i, 'Line'],
    [/MicroMessenger/i, 'WeChat'], [/Twitter/i, 'X / Twitter']
  ];
  const hit = APPS.find(([re]) => re.test(ua));
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const $ = id => document.getElementById(id);
  if (!hit) return;

  const url = location.href.split('#')[0];
  $('inappName').textContent = hit[1];
  $('inappUrl').value = url;
  const steps = isIOS
    ? ['Bấm nút <b>⋯</b> hoặc biểu tượng <b>chia sẻ</b> ở góc màn hình.', 'Chọn <b>“Mở bằng Safari”</b> (hoặc “Mở trong trình duyệt”).', 'Khi Safari hỏi, cho phép dùng <b>micro</b>. Nhớ bật Cài đặt → Siri → Siri & Đọc chính tả.']
    : ['Bấm nút <b>⋮</b> ở góc trên bên phải.', 'Chọn <b>“Mở bằng trình duyệt”</b> / <b>“Mở trong Chrome”</b>.', 'Khi Chrome hỏi, cho phép dùng <b>micro</b>.'];
  steps.push('Hoặc bấm <b>Sao chép link</b> rồi dán vào Safari/Chrome.');
  $('inappSteps').innerHTML = steps.map(s => '<li>' + s + '</li>').join('');

  if (isAndroid) {
    const b = $('inappChrome'); b.hidden = false;
    b.onclick = () => {
      const u = new URL(url);
      location.href = 'intent://' + u.host + u.pathname + u.search + '#Intent;scheme=' + u.protocol.replace(':', '') + ';package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(url) + ';end';
    };
  }
  $('inappCopy').onclick = async () => {
    const inp = $('inappUrl');
    try { await navigator.clipboard.writeText(url); }
    catch (e) { inp.focus(); inp.select(); inp.setSelectionRange(0, 9999); try { document.execCommand('copy'); } catch (e2) {} }
    $('inappCopy').textContent = 'Đã chép ✓';
  };
  $('inappStay').onclick = () => {
    $('inapp').hidden = true;
    // gợi ý dùng chế độ không micro
    const nm = $('btnNoMic'); if (nm) { nm.classList.remove('glass'); nm.classList.add('gold'); }
  };
  $('inapp').hidden = false;
})();
