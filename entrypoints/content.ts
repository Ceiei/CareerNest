import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import { fillField } from '../utils/engine/filler';
import { scanDocument } from '../utils/engine/scanner';
import type { ExtensionMessage, FieldDescriptor } from '../utils/types';
import { detectPage } from '../utils/page-detector';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  registration: 'runtime',
  main() {
    let latest: ReturnType<typeof scanDocument> | null = null;

    browser.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
      if (message.type === 'DETECT_PAGE') {
        sendResponse({ok: true, page: detectPage()});
        return false;
      }
      if (message.type === 'SCAN_FORM') {
        latest = scanDocument();
        sendResponse({ ok: true, fields: latest.fields });
        return false;
      }
      if (message.type === 'FILL_FORM') {
        const run = async () => {
          if (!latest) latest = scanDocument();
          const fields = new Map<string, FieldDescriptor>(latest.fields.map((field) => [field.id, field]));
          const results = [];
          for (const instruction of message.instructions) {
            const field = fields.get(instruction.fieldId);
            const elements = latest.elements.get(instruction.fieldId);
            if (!field || !elements) {
              results.push({ fieldId: instruction.fieldId, ok: false, reason: '页面结构已经变化，请重新扫描' });
              continue;
            }
            results.push(await fillField(field, elements, instruction.value));
          }
          sendResponse({ ok: true, results });
        };
        void run();
        return true;
      }
      if (message.type === 'FOCUS_FIELD') {
        const element = latest?.elements.get(message.fieldId)?.[0];
        if (!element) { sendResponse({ ok: false, error: '字段已经离开页面' }); return false; }
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const previousOutline = element.style.outline; const previousOffset = element.style.outlineOffset;
        element.style.outline = '3px solid #f2c94c'; element.style.outlineOffset = '3px'; element.focus({ preventScroll: true });
        window.setTimeout(() => { element.style.outline = previousOutline; element.style.outlineOffset = previousOffset; }, 2200);
        sendResponse({ ok: true }); return false;
      }
      return false;
    });
  }
});
