/**
 * ==========================================================================
 * フリーランスプログラマー M.Miyoshi ポートフォリオ スクリプト
 * 
 * 機能概要:
 * 1. ヒーローセクションのCanvas水面波紋（Ripple）＆キラキラ粒子（Sparkle）描画
 * 2. IntersectionObserverを用いた要素のスクロールフェードイン
 * 3. ヘッダーのスクロール追従・退避制御
 * 4. モバイル用ナビゲーションメニューの開閉制御
 * 5. シャボン玉風フローティングナビゲーションの開閉制御
 * 6. お問い合わせフォームのインタラクティブ送信シミュレーション
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. ヒーローセクション: 水面波紋 ＆ スパークル（キラキラ）Canvasアニメーション
  // --------------------------------------------------------------------------
  const heroSection = document.getElementById('hero');
  const canvas = document.getElementById('hero-canvas');
  
  if (canvas && heroSection) {
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1; // 高解像度ディスプレイ（Retina等）対応

    // 波紋オブジェクトとパーティクル配列
    const ripples = [];
    const particles = [];

    // キャンバスサイズを親要素（ヒーローセクション）に同期
    const resizeCanvas = () => {
      const rect = heroSection.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      // 描画バッファを高DPIに合わせてスケーリング
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    /**
     * 波紋クラス（同心円が広がりながら透明に消える）
     * - 軽量化: 重い shadowBlur を排除し、繊細な2重アルファストロークで美しい発光感を高速描画
     */
    class Ripple {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 2;
        this.maxRadius = Math.random() * 50 + 60; // 最大半径
        this.speed = Math.random() * 1.5 + 1.2;  // 広がる速度
        this.alpha = 0.65;                       // 初期透明度
        this.lineWidth = 1.8;
      }

      update() {
        this.radius += this.speed;
        this.alpha -= 0.012; // 徐々にフェードアウト
        if (this.lineWidth > 0.4) {
          this.lineWidth -= 0.02;
        }
      }

      draw() {
        if (this.alpha <= 0) return;
        ctx.save();
        
        // 外側の淡いネオングロー線（shadowBlurの代替として高速描画）
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(14, 165, 233, ${Math.max(this.alpha * 0.35, 0)})`;
        ctx.lineWidth = this.lineWidth + 2.5;
        ctx.stroke();

        // 繊細なシアン〜Azureの中心線
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(this.alpha, 0)})`;
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();

        // 内側の二重波紋
        if (this.radius > 15) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * 0.65, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(240, 255, 255, ${Math.max(this.alpha * 0.5, 0)})`;
          ctx.lineWidth = this.lineWidth * 0.7;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    /**
     * キラキラ粒子（Sparkle）クラス（星のように光って四方に広がる）
     * - 軽量化: shadowBlur を排除しアルファブレンディングで高速化
     */
    class Sparkle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 3 + 1.5;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.015;
        // 白、淡い水色、エメラルドミントのいずれか
        const colors = [
          '255, 255, 255',
          '186, 230, 253',
          '224, 242, 254',
          '204, 251, 241'
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.96; // 減速
        this.vy *= 0.96;
        this.alpha -= this.decay;
      }

      draw() {
        if (this.alpha <= 0) return;
        ctx.save();

        // 外側の淡い光輪（グロー）
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${Math.max(this.alpha * 0.25, 0)})`;
        ctx.fill();

        // 中心粒子
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${Math.max(this.alpha, 0)})`;
        ctx.fill();

        // 4方向の光の筋（十字のきらめき）
        if (this.size > 2) {
          ctx.strokeStyle = `rgba(${this.color}, ${Math.max(this.alpha * 0.7, 0)})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(this.x - this.size * 2, this.y);
          ctx.lineTo(this.x + this.size * 2, this.y);
          ctx.moveTo(this.x, this.y - this.size * 2);
          ctx.lineTo(this.x, this.y + this.size * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // 波紋とキラキラを発生させる関数
    const addEffects = (x, y, count = 3) => {
      // 要素数が過多にならないよう上限制御
      if (ripples.length < 25) {
        ripples.push(new Ripple(x, y));
      }
      if (particles.length < 60) {
        for (let i = 0; i < count; i++) {
          particles.push(new Sparkle(x, y));
        }
      }
    };

    // マウスカーソル移動イベント
    let lastMoveTime = 0;
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const now = Date.now();
      // 一定間隔（約45ms）ごとにエフェクトを生成して軽快さを維持
      if (now - lastMoveTime > 45) {
        addEffects(x, y, 2);
        lastMoveTime = now;
      }
    }, { passive: true });

    // タッチデバイス（スマホ・タブレット）対応
    heroSection.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const rect = heroSection.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        addEffects(x, y, 2);
      }
    }, { passive: true });

    // アイドル時の自動雫エフェクト（マウス停止時でも水面の自然な揺らぎを演出）
    let autoDropTimer = 0;
    const triggerAutoDrop = () => {
      const randomX = Math.random() * width;
      const randomY = Math.random() * height;
      addEffects(randomX, randomY, 2);
    };

    // アニメーションループ制御（画面外スクロール時は自動一時停止して負荷ゼロ化）
    let isHeroVisible = true;
    let animFrameId = null;

    const render = () => {
      if (!isHeroVisible) {
        animFrameId = null;
        return; // 画面外時は描画ループを停止
      }

      ctx.clearRect(0, 0, width, height);

      // 波紋の更新と描画
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.update();
        r.draw();
        if (r.alpha <= 0) {
          ripples.splice(i, 1);
        }
      }

      // キラキラ粒子の更新と描画
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      // 自然な雫の発生（約140フレームに1回）
      autoDropTimer++;
      if (autoDropTimer > 140) {
        triggerAutoDrop();
        autoDropTimer = 0;
      }

      animFrameId = requestAnimationFrame(render);
    };

    // IntersectionObserver でヒーローセクションの可視性を監視（画面外時は省エネ停止）
    if ('IntersectionObserver' in window) {
      const heroVisibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isHeroVisible = entry.isIntersecting;
          if (isHeroVisible && !animFrameId) {
            animFrameId = requestAnimationFrame(render);
          }
        });
      }, { threshold: 0.05 });

      heroVisibilityObserver.observe(heroSection);
    } else {
      render();
    }

    // 初期波紋を中央付近に1回落とす
    setTimeout(() => {
      addEffects(width / 2, height / 2, 4);
    }, 500);
  }

  // --------------------------------------------------------------------------
  // 2. スクロール連動制御（ヘッダー非表示 ＆ フローティングナビ表示の切り替え）
  // --------------------------------------------------------------------------
  const header = document.getElementById('site-header');
  const floatingNav = document.getElementById('floating-bubble-nav');
  const heroEl = document.getElementById('hero');
  const navMenu = document.getElementById('nav-menu');

  // スクロール位置を監視して、ヒーローセクションからメインセクションに入ったかを判定
  const handleScrollUpdate = () => {
    // モバイルメニュー展開中はヘッダーの非表示化や位置ズレを防ぐため処理をスキップ
    if (navMenu && navMenu.classList.contains('is-active')) {
      return;
    }

    // ヒーローセクションの底辺位置（メインセクションの開始位置）を取得
    let threshold = 180;
    if (heroEl) {
      threshold = heroEl.offsetHeight - 80;
    }

    const currentScrollY = window.scrollY || window.pageYOffset;

    if (currentScrollY >= threshold) {
      // メインセクション突入時: ヘッダーを非表示にし、画面右下にバブルナビ（Contact＋丸枠ボタン）を表示
      if (header) header.classList.add('is-hidden');
      if (floatingNav) floatingNav.classList.add('is-visible');
    } else {
      // ヒーローセクション滞在時: ヘッダーを再表示し、バブルナビを非表示にする
      if (header) header.classList.remove('is-hidden');
      if (floatingNav) {
        floatingNav.classList.remove('is-visible');
        // ヒーローに戻った際は展開中のバブルメニューも自動で閉じる
        floatingNav.classList.remove('is-open');
      }
    }
  };

  // スクロールイベントを軽量に処理（パッシブリスナー）
  window.addEventListener('scroll', handleScrollUpdate, { passive: true });
  // 初期ロード時にも実行して正しい状態を設定
  handleScrollUpdate();


  // --------------------------------------------------------------------------
  // 3. シャボン玉風フローティングナビゲーションの開閉制御
  // --------------------------------------------------------------------------
  const bubbleToggleBtn = document.getElementById('bubble-toggle-btn');
  const rippleWave = document.getElementById('ripple-wave');
  const bubbleBackdrop = document.getElementById('bubble-backdrop');
  const bubbleItems = document.querySelectorAll('.bubble-item');
  const floatingContactBtn = document.getElementById('floating-contact-btn');

  /**
   * 水面の波紋（Ripple）アニメーションをトリガーする関数
   */
  const triggerBubbleRipple = () => {
    if (rippleWave) {
      rippleWave.classList.remove('animate-ripple');
      // DOMリフローを発生させてアニメーションを即座に再起動
      void rippleWave.offsetWidth;
      rippleWave.classList.add('animate-ripple');
    }
  };

  /**
   * シャボン玉メニューの開閉を切り替える関数
   */
  const toggleBubbleMenu = () => {
    if (!floatingNav || !bubbleToggleBtn) return;
    
    // クリック時に波紋を発生
    triggerBubbleRipple();

    const isCurrentlyOpen = floatingNav.classList.contains('is-open');
    if (isCurrentlyOpen) {
      floatingNav.classList.remove('is-open');
      bubbleToggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      floatingNav.classList.add('is-open');
      bubbleToggleBtn.setAttribute('aria-expanded', 'true');
    }
  };

  /**
   * シャボン玉メニューを閉じる関数
   */
  const closeBubbleMenu = () => {
    if (floatingNav && floatingNav.classList.contains('is-open')) {
      floatingNav.classList.remove('is-open');
      if (bubbleToggleBtn) {
        bubbleToggleBtn.setAttribute('aria-expanded', 'false');
      }
    }
  };

  // 丸枠ハンバーガーボタンクリックで開閉
  if (bubbleToggleBtn) {
    bubbleToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBubbleMenu();
    });
  }

  // メニュー展開時の背景オーバーレイをクリックで閉じる
  if (bubbleBackdrop) {
    bubbleBackdrop.addEventListener('click', closeBubbleMenu);
  }

  // 各セクションリンク（シャボン玉バブル）をクリックした際にメニューを閉じる
  bubbleItems.forEach(item => {
    item.addEventListener('click', () => {
      setTimeout(closeBubbleMenu, 150);
    });
  });

  // Contactボタンをクリックした際にもメニューが開いていれば閉じる
  if (floatingContactBtn) {
    floatingContactBtn.addEventListener('click', closeBubbleMenu);
  }

  // キーボード操作（Escapeキー）でメニューを閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBubbleMenu();
    }
  });


  // --------------------------------------------------------------------------
  // 3. スクロール連動のフェードイン表示 (Intersection Observer)
  // --------------------------------------------------------------------------
  const fadeElements = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window) {
    const fadeObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // 一度表示されたら監視を解除
        }
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    fadeElements.forEach(el => fadeObserver.observe(el));
  } else {
    // 古いブラウザ対応: すべて即時表示
    fadeElements.forEach(el => el.classList.add('is-visible'));
  }


  // --------------------------------------------------------------------------
  // 4. モバイル用ナビゲーションメニューの開閉
  // --------------------------------------------------------------------------
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.querySelectorAll('.nav-link');
  const navBackdrop = document.getElementById('nav-backdrop');

  const closeMobileNav = () => {
    if (navMenu) navMenu.classList.remove('is-active');
    if (menuToggle) menuToggle.classList.remove('is-active');
    if (navBackdrop) navBackdrop.classList.remove('is-active');
    document.body.classList.remove('mobile-menu-open');
    // メニューを閉じた後にスクロール状態を再評価
    handleScrollUpdate();
  };

  const toggleMobileNav = () => {
    if (!menuToggle || !navMenu) return;
    const isActive = navMenu.classList.toggle('is-active');
    menuToggle.classList.toggle('is-active', isActive);
    if (navBackdrop) navBackdrop.classList.toggle('is-active', isActive);
    
    if (isActive) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
      handleScrollUpdate();
    }
  };

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileNav();
    });

    // リンクをクリックした際にメニューを閉じる
    navLinks.forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    // メニュー枠外（透明オーバーレイ）をタップした際に自然に閉じる
    if (navBackdrop) {
      navBackdrop.addEventListener('click', closeMobileNav);
    }

    // キーボード（Escapeキー）でも閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });
  }



  // --------------------------------------------------------------------------
  // 6. お問い合わせフォーム送信（Formspree API 連携）
  // --------------------------------------------------------------------------
  const contactForm = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const successToast = document.getElementById('form-success-toast');

  if (contactForm && submitBtn && successToast) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // 画面遷移を防ぎ、非同期で送信

      // 送信ボタンをローディング表示に切り替え
      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>送信中...</span>';

      const formData = new FormData(contactForm);

      try {
        // Formspree エンドポイントへ非同期 POST 送信
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          // 送信成功: 入力欄をクリアし、専用サンクスページ（thanks.html）へリダイレクト
          contactForm.reset();
          window.location.href = 'thanks.html';
        } else {
          // サーバーエラー時の通知
          alert('メッセージの送信に失敗しました。時間をおいて再度お試しいただくか、直接メールにてお問い合わせください。');
        }
      } catch (error) {
        console.error('Formspree submission error:', error);
        alert('通信エラーが発生しました。インターネット接続状況をご確認の上、再度お試しください。');
      } finally {
        // ボタン表示を元の状態に復帰
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

});
