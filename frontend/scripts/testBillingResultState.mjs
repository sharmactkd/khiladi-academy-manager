import test from 'node:test';
import assert from 'node:assert/strict';
import {billingResultState,hasPaymentConfirmation} from '../src/pages/billing/billingResultState.js';
test('direct links and missing router state are safe and do not claim a new payment',()=>{
 for(const value of [null,undefined,false,'',[],{}]){
  assert.deepEqual(billingResultState(value),{});
  assert.equal(hasPaymentConfirmation(value),false);
 }
});
test('verified checkout navigation retains subscription and invoice details',()=>{
 const state={subscription:{status:'active',planCode:'professional'},invoice:{_id:'invoice-1'}};
 assert.equal(billingResultState(state),state);
 assert.equal(hasPaymentConfirmation(state),true);
 assert.equal(hasPaymentConfirmation({message:'A payment may be pending'}),false);
});
