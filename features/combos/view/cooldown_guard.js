// features/combos/view/cooldown_guard.js

// חוסם הצטיידות בזמן ה-cooldown של המשחק ומציג את הטיימר האדום.
// הרציונל: CLAUDE.mds/combos.md

(function () {
  "use strict";

  const POLL_MS = 1000;

  function mmss(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  Object.assign(window.TankiQoL.ViewRenderer, {
    cooldownTimer: null,
    cooldownActive: false,

    startCooldownGuard() {
      if (this.cooldownTimer) return;
      const tick = async () => {
        this.cooldownTimer = null;
        if (!this.isViewVisible()) {
          this.applyCooldownState(null);
          return;
        }
        const bridge = window.TankiQoL.GarageBridge;
        let res = null;
        if (bridge && bridge.readCooldown) {
          try { res = await bridge.readCooldown(); } catch (e) { res = null; }
        }
        this.applyCooldownState(res && res.active ? res : null);
        this.cooldownTimer = setTimeout(tick, POLL_MS);
      };
      tick();
    },

    stopCooldownGuard() {
      if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
      this.applyCooldownState(null);
    },

    // state=null מנקה; אחרת {msLeft}
    applyCooldownState(state) {
      this.cooldownActive = !!state;
      if (!this.viewElement) return;
      this.viewElement.classList.toggle("cme_cooldown", this.cooldownActive);

      // המארח חייב להיות ה-relative, כי הבלוק ממורכז ב-inset+margin
      const host = this.viewElement.querySelector(
        ".cme_commonBlockForDescriptionAndButton",
      );
      if (!host) return;

      let block = host.querySelector(".cme_cooldown-block");
      if (!this.cooldownActive) {
        if (block) block.remove();
        return;
      }
      if (!block) block = this.buildCooldownBlock(host);
      const time = block.querySelector(".cme_cooldown-time");
      if (time) time.textContent = mmss(state.msLeft);
    },

    // אותו מבנה קינון כמו במשחק, בשמות cme_ שלנו
    buildCooldownBlock(host) {
      const LM = window.TankiQoL.LanguageManager;
      const block = document.createElement("div");
      block.className = "cme_cooldown-block";

      const caption = document.createElement("h4");
      caption.className = "cme_cooldown-caption";
      caption.textContent = LM.getUIText("cooldownCaption");

      const timer = document.createElement("div");
      timer.className = "cme_cooldown-timer";
      const inner = document.createElement("div");
      inner.className = "cme_cooldown-inner";
      const time = document.createElement("span");
      time.className = "cme_cooldown-time";

      inner.appendChild(time);
      timer.appendChild(inner);
      block.appendChild(caption);
      block.appendChild(timer);
      host.appendChild(block);
      return block;
    },
  });
})();
