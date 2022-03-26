import {
    Field,
    PrivateKey,
    PublicKey,
    SmartContract,
    state,
    State,
    method,
    UInt64,
    Mina,
    Party,
    isReady,
    shutdown,
  } from 'snarkyjs';

  class Assignment extends SmartContract {
    @state(Field) x: State<Field>;
    @state(Field) y: State<Field>;
    @state(Field) z: State<Field>;

    constructor(initialBalance: UInt64, address: PublicKey, x: Field, y: Field, z: Field) {
        super(address);
        this.balance.addInPlace(initialBalance);
        this.x = State.init(x);
        this.y = State.init(y);
        this.z = State.init(z);
      }

    @method async update(updated: Field) {
        const x = await this.x.get();
        const y = await this.y.get();
        const z = await this.z.get();
        const num = new Field(20);

        num.assertEquals(updated);

        this.x.set(updated);
        this.y.set(updated);
        this.z.set(updated);

      }
}

    async function runSimpleApp(){
        await isReady;

        const Local = Mina.LocalBlockchain();
        Mina.setActiveInstance(Local);
        const account1 = Local.testAccounts[0].privateKey;
        const account2 = Local.testAccounts[1].privateKey;
      
        const snappPrivkey = PrivateKey.random();
        const snappPubkey = snappPrivkey.toPublicKey();

        let snappInstance: Assignment;
        const initSnappState1 = new Field(1);
        const initSnappState2 = new Field(2);
        const initSnappState3 = new Field(3);


        // Deploys the snapp
        await Mina.transaction(account1, async () => {
        // account2 sends 1000000000 to the new snapp account
        const amount = UInt64.fromNumber(1000000000);
        const p = await Party.createSigned(account2);
        p.balance.subInPlace(amount);

        snappInstance = new Assignment(amount, snappPubkey, initSnappState1,initSnappState2, initSnappState3);
    })
        .send()
        .wait();

          // Update the snapp
        await Mina.transaction(account1, async () => {
            await snappInstance.update(new Field(20));
        })
            .send()
            .wait();

        await Mina.transaction(account1, async () => {
            // Fails, because the provided value is wrong.
            await snappInstance.update(new Field(109));
            })
            .send()
            .wait()
            .catch((e) => console.log('second update attempt failed'));
        
            const a = await Mina.getAccount(snappPubkey);
        
            console.log('final state value of x', a.snapp.appState[0].toString());
            console.log('final state value of y', a.snapp.appState[1].toString());
            console.log('final state value of z', a.snapp.appState[2].toString());

}

runSimpleApp();

shutdown();