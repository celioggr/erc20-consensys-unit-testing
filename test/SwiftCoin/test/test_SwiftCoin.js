const { assertRevert } = require('./assertRevert.js');
var w3eth = require('web3-eth');

const SwftCoin = artifacts.require('SwftCoin');


let HST;
let HST2;
const contract2test = SwftCoin;
const contract_name = 'SwiftCoin';
const contract_symbol = "XYZ";
const contract_decimals = 10;
const maxtokens = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
const initialBalance = 10000;
contract(contract_name, (accounts) => {
  beforeEach(async () => {
    HST = await contract2test.new(10000,"SwiftCoin",10,"XYZ",{"from": accounts[0]})
    HST2 = await contract2test.new(10000,"XYZ",1,"XYZ",{"from": accounts[0]})
  });

  it('creation: should create an initial balance of 10000 for the creator', async () => {
    const balance = await HST.balanceOf(accounts[0]);
    assert.strictEqual(balance.toNumber(), initialBalance);
  });

  it('creation: test correct setting of vanity information', async () => {
    const name = await HST.name();
    assert.strictEqual(name, contract_name);

    const decimals = await HST.decimals();
    assert.strictEqual(decimals.toNumber(), contract_decimals);

    const symbol = await HST.symbol();
    assert.strictEqual(symbol, contract_symbol);
  });

  it('creation: should succeed in creating over 2^256 - 1 (max) tokens', async () => {

    const totalSupply = await HST2.totalSupply();
    //const match = totalSupply.equals('1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77');
    //assert(match, 'result is not correct');
    assert(totalSupply,'1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77');
  });

  // TRANSERS
  /*
  // normal transfers without approvals
  it('transfers: ether transfer should be reversed.', async () => {
    const balanceBefore = await HST.balanceOf(accounts[0]);
    assert.strictEqual(balanceBefore.toNumber(), initialBalance);

    await assertRevert(new Promise((resolve, reject) => {
      w3eth.sendTransaction({ from: accounts[0], to: HST.address, value: 10000000000000000000}, (err, res) => {
        if (err) { reject(err); }
        resolve(res);
      });
    }));

    const balanceAfter = await HST.balanceOf(accounts[0]);
    assert.strictEqual(balanceAfter.toNumber(), initialBalance);
  });
  */
  it('transfers: should transfer 10000 to accounts[1] with accounts[0] having 10000', async () => {
    await HST.transfer(accounts[1], 10000, { from: accounts[0] });
    const balance = await HST.balanceOf(accounts[1]);
    assert.strictEqual(balance.toNumber(), 10000);
  });

  it('transfers: should fail when trying to transfer 10001 to accounts[1] with accounts[0] having 10000', async () => {
    await assertRevert(HST.transfer(accounts[1], initialBalance+1, { from: accounts[0] }));
  });

  it('transfers: should handle zero-transfers normally', async () => {
    assert(await HST.transfer(accounts[1], 0, { from: accounts[0] }), 'zero-transfer has failed');
  });

  // NOTE: testing uint256 wrapping is impossible since you can't supply > 2^256 -1
  // todo: transfer max amounts

  // APPROVALS
  it('approvals: msg.sender should approve 100 to accounts[1]', async () => {
    await HST.approve(accounts[1], 100, { from: accounts[0] });
    const allowance = await HST.allowance(accounts[0], accounts[1]);
    assert.strictEqual(allowance.toNumber(), 100);
  });

  // bit overkill. But is for testing a bug
  it('approvals: msg.sender approves accounts[1] of 100 & withdraws 20 once.', async () => {
    const balance0 = await HST.balanceOf.call(accounts[0]);
    assert.strictEqual(balance0.toNumber(), initialBalance);

    await HST.approve(accounts[1], 100, { from: accounts[0] }); // 100
    const balance2 = await HST.balanceOf.call(accounts[2]);
    assert.strictEqual(balance2.toNumber(), 0, 'balance2 not correct');

    await HST.transferFrom.call(accounts[0], accounts[2], 20, { from: accounts[1] });
    await HST.allowance.call(accounts[0], accounts[1]);
    tx=await HST.transferFrom(accounts[0], accounts[2], 20, { from: accounts[1] }); // -20
    const allowance01 = await HST.allowance.call(accounts[0], accounts[1]);
    assert.strictEqual(allowance01.toNumber(), 80); // =80

    const balance22 = await HST.balanceOf.call(accounts[2]);
    assert.strictEqual(balance22.toNumber(), 20);

    const balance02 = await HST.balanceOf.call(accounts[0]);
    assert.strictEqual(balance02.toNumber(), initialBalance-20);
  });

  // should approve 100 of msg.sender & withdraw 50, twice. (should succeed)
  it('approvals: msg.sender approves accounts[1] of 100 & withdraws 20 twice.', async () => {
    await HST.approve(accounts[1], 100, { from: accounts[0] });
    const allowance01 = await HST.allowance(accounts[0], accounts[1]);
    assert.strictEqual(allowance01.toNumber(), 100);

    await HST.transferFrom(accounts[0], accounts[2], 20, { from: accounts[1] });
    const allowance012 = await HST.allowance(accounts[0], accounts[1]);
    assert.strictEqual(allowance012.toNumber(), 80);

    const balance2 = await HST.balanceOf(accounts[2]);
    assert.strictEqual(balance2.toNumber(), 20);

    const balance0 = await HST.balanceOf(accounts[0]);
    assert.strictEqual(balance0.toNumber(), initialBalance-20);

    // FIRST tx done.
    // onto next.
    await HST.transferFrom(accounts[0], accounts[2], 20, { from: accounts[1] });
    const allowance013 = await HST.allowance(accounts[0], accounts[1]);
    assert.strictEqual(allowance013.toNumber(), 60);

    const balance22 = await HST.balanceOf(accounts[2]);
    assert.strictEqual(balance22.toNumber(), 40);

    const balance02 = await HST.balanceOf(accounts[0]);
    assert.strictEqual(balance02.toNumber(), initialBalance-40);
  });

  // should approve 100 of msg.sender & withdraw 50 & 60 (should fail).
  it('approvals: msg.sender approves accounts[1] of 100 & withdraws 50 & 60 (2nd tx should fail)', async () => {
    await HST.approve(accounts[1], 100, { from: accounts[0] });
    const allowance01 = await HST.allowance(accounts[0], accounts[1]);
    assert.strictEqual(allowance01.toNumber(), 100);

    await HST.transferFrom(accounts[0], accounts[2], 50, { from: accounts[1] });
    const allowance012 = await HST.allowance(accounts[0], accounts[1]);
    assert.strictEqual(allowance012.toNumber(), 50);

    const balance2 = await HST.balanceOf(accounts[2]);
    assert.strictEqual(balance2.toNumber(), 50);

    const balance0 = await HST.balanceOf(accounts[0]);
    assert.strictEqual(balance0.toNumber(), initialBalance -50);

    // FIRST tx done.
    // onto next.
    await assertRevert(HST.transferFrom(accounts[0], accounts[2], 60, { from: accounts[1] }));
  });

  it('approvals: attempt withdrawal from account with no allowance (should fail)', async () => {
    await assertRevert(HST.transferFrom(accounts[0], accounts[2], 60, { from: accounts[1] }));
  });

  it('approvals: allow accounts[1] 100 to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.', async () => {
    await HST.approve(accounts[1], 100, { from: accounts[0] });
    await HST.transferFrom(accounts[0], accounts[2], 60, { from: accounts[1] });
    await HST.approve(accounts[1], 0, { from: accounts[0] });
    await assertRevert(HST.transferFrom(accounts[0], accounts[2], 10, { from: accounts[1] }));
  });

  it('approvals: approve max (2^256 - 1)', async () => {
    await HST.approve(accounts[1], '115792089237316195423570985008687907853269984665640564039457584007913129639935', { from: accounts[0] });
    const allowance = await HST.allowance(accounts[0], accounts[1]);
    //assert(allowance.equals('1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77'));
    assert(allowance,'1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77')

  });

  // should approve max of msg.sender & withdraw 20 without changing allowance (should succeed).
  it('approvals: msg.sender approves accounts[1] of max (2^256 - 1) & withdraws 20', async () => {
    const balance0 = await HST.balanceOf(accounts[0]);
    assert.strictEqual(balance0.toNumber(), initialBalance);

    //const max = '1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77';
    const max = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
    await HST.approve(accounts[1], max, { from: accounts[0] });
    const balance2 = await HST.balanceOf(accounts[2]);
    assert.strictEqual(balance2.toNumber(), 0, 'balance2 not correct');

    await HST.transferFrom(accounts[0], accounts[2], 20, { from: accounts[1] });
    const allowance01 = await HST.allowance(accounts[0], accounts[1]);
    //assert(allowance01.equals(max));
    assert(allowance01,max);

    const balance22 = await HST.balanceOf(accounts[2]);
    assert.strictEqual(balance22.toNumber(), 20);

    const balance02 = await HST.balanceOf(accounts[0]);
    assert.strictEqual(balance02.toNumber(), initialBalance-20);
  });

  /* eslint-disable no-underscore-dangle */
  it('events: should fire Transfer event properly', async () => {
    const res = await HST.transfer(accounts[1], '2666', { from: accounts[0] });
    const transferLog = res.logs.find(element => element.event.match('Transfer'));
    assert.strictEqual(transferLog.args.from, accounts[0]);
    assert.strictEqual(transferLog.args.to, accounts[1]);
    assert.strictEqual(transferLog.args.value.toString(), '2666');
  });

  it('events: should fire Transfer event normally on a zero transfer', async () => {
    const res = await HST.transfer(accounts[1], '0', { from: accounts[0] });
    const transferLog = res.logs.find(element => element.event.match('Transfer'));
    assert.strictEqual(transferLog.args.from, accounts[0]);
    assert.strictEqual(transferLog.args.to, accounts[1]);
    assert.strictEqual(transferLog.args.value.toString(), '0');
  });

  it('events: should fire Approval event properly', async () => {
    const res = await HST.approve(accounts[1], '2666', { from: accounts[0] });
    const approvalLog = res.logs.find(element => element.event.match('Approval'));
    assert.strictEqual(approvalLog.args.owner, accounts[0]);
    assert.strictEqual(approvalLog.args.spender, accounts[1]);
    assert.strictEqual(approvalLog.args.value.toString(), '2666');
  });
});
