const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const web = path.join(__dirname, '../apps/web/public');
const admin = path.join(__dirname, '../apps/admin/public');
const source = fs.readFileSync(path.join(web, 'browser-support.js'), 'utf8');

function check(overrides = {}, moduleSupport = true) {
  const document = {
    documentElement: { className: 'h-full browser-pending' },
    createElement: () => (moduleSupport ? { noModule: false } : {}),
  };
  const window = {
    Promise,
    fetch() {},
    URL,
    URLSearchParams,
    AbortController,
    ResizeObserver() {},
    CSS: { supports: () => true, registerProperty() {} },
    ...overrides,
  };
  vm.runInNewContext(source, { document, window });
  return document.documentElement.className;
}

test('both apps ship identical standalone compatibility assets', () => {
  for (const name of ['browser-support.js', 'browser-support.css']) {
    assert.equal(
      fs.readFileSync(path.join(web, name), 'utf8'),
      fs.readFileSync(path.join(admin, name), 'utf8'),
    );
  }
});

test('both entry points provide a fallback before the application starts', () => {
  const entries = [
    fs.readFileSync(path.join(__dirname, '../apps/web/app/layout.tsx'), 'utf8'),
    fs.readFileSync(path.join(__dirname, '../apps/admin/index.html'), 'utf8'),
  ];
  for (const entry of entries) {
    assert.match(entry, /browser-pending/);
    assert.match(entry, /browser-support\.css/);
    assert.match(entry, /browser-support\.js/);
    assert.match(entry, /id="browser-support-notice"/);
  }
  const css = fs.readFileSync(path.join(web, 'browser-support.css'), 'utf8');
  assert.match(css, /html\.browser-pending body > :not\(#browser-support-notice\)/);
  assert.match(css, /html\.browser-supported #browser-support-notice/);
});

test('supported browsers show the application', () => {
  assert.equal(check(), 'h-full browser-supported');
});

test('missing browser features leave the fallback visible', () => {
  assert.equal(check({}, false), 'h-full browser-pending');
  for (const feature of ['Promise', 'fetch', 'URL', 'URLSearchParams', 'AbortController', 'ResizeObserver', 'CSS']) {
    assert.equal(check({ [feature]: undefined }), 'h-full browser-pending', feature);
  }
  assert.equal(check({ CSS: { supports: () => false, registerProperty() {} } }), 'h-full browser-pending');
  assert.equal(check({ CSS: { supports: () => true } }), 'h-full browser-pending');
});
