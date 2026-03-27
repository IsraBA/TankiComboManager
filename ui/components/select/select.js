// ui/components/select/select.js

// קומפוננטת dropdown בסגנון DropDownStyle של המשחק
(function () {
    'use strict';

    window.TankiComboManager = window.TankiComboManager || {};

    window.TankiComboManager.Select = {

        // יצירת dropdown חדש
        create(options = {}) {
            const id = options.id || 'cme_select-' + Date.now();
            const label = options.label || '';
            const selectOptions = options.options || [];
            const selected = options.selected || (selectOptions.length > 0 ? selectOptions[0].value : '');
            const onChange = options.onChange || null;

            // קונטיינר ראשי
            const container = document.createElement('div');
            container.className = 'cme_select-container';
            container.id = id;

            // תווית
            if (label) {
                const labelEl = document.createElement('h3');
                labelEl.className = 'cme_select-label';
                labelEl.textContent = label;
                container.appendChild(labelEl);
            }

            // טריגר (כפתור הפתיחה)
            const trigger = document.createElement('div');
            trigger.className = 'cme_select-trigger';

            const triggerText = document.createElement('div');
            triggerText.className = 'cme_select-trigger-text';
            const triggerSpan = document.createElement('span');
            triggerText.appendChild(triggerSpan);
            trigger.appendChild(triggerText);

            const arrow = document.createElement('div');
            arrow.className = 'cme_select-arrow';
            trigger.appendChild(arrow);

            container.appendChild(trigger);

            // רשימת אפשרויות — קונטיינר חיצוני + פנימי כמו במשחק
            const optionsList = document.createElement('div');
            optionsList.className = 'cme_select-options';

            const optionsInner = document.createElement('div');
            optionsInner.className = 'cme_select-options-inner';
            optionsList.appendChild(optionsInner);

            let currentValue = selected;

            // בניית אפשרויות
            function buildOptions() {
                optionsInner.innerHTML = '';
                selectOptions.forEach(opt => {
                    // מבנה: div > div.option > span
                    const wrapper = document.createElement('div');

                    const optionEl = document.createElement('div');
                    optionEl.className = 'cme_select-option';
                    if (opt.value === currentValue) {
                        optionEl.classList.add('cme_select-selected');
                    }
                    optionEl.dataset.value = opt.value;
                    const optSpan = document.createElement('span');
                    optSpan.textContent = opt.text;
                    optionEl.appendChild(optSpan);

                    wrapper.appendChild(optionEl);

                    wrapper.addEventListener('click', (e) => {
                        e.stopPropagation();
                        currentValue = opt.value;
                        triggerSpan.textContent = opt.text;
                        closeDropdown();
                        buildOptions();
                        if (onChange) onChange(opt.value);
                    });

                    optionsInner.appendChild(wrapper);
                });
            }

            container.appendChild(optionsList);

            // עדכון טקסט הטריגר לפי הערך הנבחר
            const selectedOption = selectOptions.find(o => o.value === selected);
            triggerSpan.textContent = selectedOption ? selectedOption.text : '';

            buildOptions();

            // פתיחה/סגירה
            function toggleDropdown() {
                container.classList.toggle('cme_select-open');
            }

            function closeDropdown() {
                container.classList.remove('cme_select-open');
            }

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDropdown();
            });

            // לחיצה מחוץ סוגרת
            document.addEventListener('click', () => {
                closeDropdown();
            });

            // API לעדכון מבחוץ
            container._setValue = function (value) {
                currentValue = value;
                const opt = selectOptions.find(o => o.value === value);
                triggerSpan.textContent = opt ? opt.text : '';
                buildOptions();
            };

            container._getValue = function () {
                return currentValue;
            };

            return container;
        }
    };
})();
