import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword,randomHex,constantTimeEqual,digest} from '../lib/password.ts';
import {canPerform,canViewFinance} from '../lib/permissions.ts';
test('salted password hashes verify correctly and never equal plaintext',async()=>{
 const password='test-password-not-an-account',salt=randomHex();
 const hash=await hashPassword(password,salt);
 assert.equal(hash.length,64);assert.notEqual(hash,password);
 assert.ok(constantTimeEqual(hash,await hashPassword(password,salt)));
 assert.ok(!constantTimeEqual(hash,await hashPassword('wrong-password',salt)));
 assert.notEqual(hash,await hashPassword(password,randomHex()));
 assert.notEqual(await digest(randomHex()),await digest(randomHex()));
});
test('employees only perform order, payment, and progress operations',()=>{
 for(const action of ['create','payment','status'])assert.equal(canPerform('employee',action),true);
 assert.equal(canPerform('employee','expense'),false);
 assert.equal(canViewFinance('employee'),false);
 assert.equal(canPerform('owner','expense'),true);
 assert.equal(canViewFinance('owner'),true);
 assert.equal(canPerform('admin','expense'),false);
 assert.equal(canPerform('owner','grant-owner'),false);
 assert.equal(canViewFinance(''),false);
});
