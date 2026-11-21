import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
test('saleDay uses Bangkok midnight, not UTC or device timezone',()=>{
 assert.equal(typeof core.saleDay,'function');
 assert.equal(core.saleDay('2026-11-16T16:59:59Z'),'2026-11-16');
 assert.equal(core.saleDay('2026-11-16T17:00:00Z'),'2026-11-17');
 assert.equal(core.saleDay('2026-12-31T18:00:00Z'),'2027-01-01');
});
