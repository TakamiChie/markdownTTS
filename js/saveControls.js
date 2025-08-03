(() => {
  // ページ読み込み時に値を復元し、変更があれば保存
  document.addEventListener('DOMContentLoaded', () => {
    const ctrls = document.querySelectorAll('.savecontrol');
    ctrls.forEach(ctrl => {
      const key = `save_${ctrl.id}`;
      let stored = localStorage.getItem(key);

      // 保存済みの値をコントロールに反映
      const restore = () => {
        if (stored !== null) {
          if (ctrl.type === 'checkbox') {
            ctrl.checked = stored === 'true';
          } else if (ctrl.tagName.toLowerCase() === 'select' && ctrl.hasAttribute('data-byname')) {
            // textContentで復元
            const found = Array.from(ctrl.options).find(opt => opt.textContent === stored);
            if (found) {
              ctrl.value = found.value;
            }
          } else if (ctrl.tagName.toLowerCase() === 'select') {
            const exists = Array.from(ctrl.options).some(opt => opt.value === stored);
            if (exists) {
              ctrl.value = stored;
            }
          } else {
            ctrl.value = stored;
          }
        }
      };

      restore();

      // select要素は後からoptionが追加されることがある
      if (ctrl.tagName.toLowerCase() === 'select') {
        const observer = new MutationObserver(() => {
          restore();
          if (ctrl.hasAttribute('data-byname')) {
            const found = Array.from(ctrl.options).find(opt => opt.textContent === stored);
            if (found && ctrl.value === found.value) {
              observer.disconnect();
            }
          } else if (ctrl.value === stored) {
            observer.disconnect();
          }
        });
        observer.observe(ctrl, { childList: true });
      }

      // 値が変化したら保存
      const save = () => {
        let value;
        if (ctrl.type === 'checkbox') {
          value = ctrl.checked;
        } else if (ctrl.tagName.toLowerCase() === 'select' && ctrl.hasAttribute('data-byname')) {
          // 選択中optionのtextContentを保存
          value = ctrl.options[ctrl.selectedIndex]?.textContent ?? '';
        } else {
          value = ctrl.value;
        }
        stored = value.toString();
        localStorage.setItem(key, stored);
      };
      ctrl.addEventListener('change', save);
      ctrl.addEventListener('input', save);
    });
  });
})();