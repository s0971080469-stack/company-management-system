import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('所有聊天室身分都能開啟系統通知，仍禁止回覆系統通知', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const contacts = app.slice(app.indexOf('  const contacts = ['), app.indexOf('  const [open, setOpen]'));
  assert.match(contacts, /\{ id: SYSTEM_CHAT_ID, name: "系統通知" \}/);
  assert.doesNotMatch(contacts, /myId === ADMIN_CHAT_ID/);
  assert.match(app, /if \(!content \|\| !activeId \|\| activeId === SYSTEM_CHAT_ID\) return/);
});
