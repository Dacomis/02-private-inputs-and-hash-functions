import readline from 'readline';
import { GuessGame } from './GuessGame.js';
import { Field, Mina, PrivateKey, AccountUpdate, Bool } from 'o1js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const Local = await Mina.LocalBlockchain({ proofsEnabled: false });
  Mina.setActiveInstance(Local);

  const deployerAccount = Local.testAccounts[0];
  const deployerKey = deployerAccount.key;
  const zkAppPrivateKey = PrivateKey.random();
  const zkAppAddress = zkAppPrivateKey.toPublicKey();
  const zkAppInstance = new GuessGame(zkAppAddress);

  // Off-chain random number generation and parity determination
  const randomNumber = Math.floor(Math.random() * 100) + 1;
  const parity = Bool(randomNumber % 2 === 0);

  await Mina.transaction(deployerAccount, async () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    await zkAppInstance.deploy();
    await zkAppInstance.initGame(parity);
  })
    .prove()
    .sign([deployerKey, zkAppPrivateKey])
    .send();

  // Ask user to make a guess
  rl.question(
    '🔮 Is the number Even or Uneven (type "even" or "uneven")? ',
    async (answer) => {
      const guess = Bool(answer.trim().toLowerCase() === 'even');
      await Mina.transaction(deployerAccount, async () => {
        await zkAppInstance.makeGuess(guess);
      })
        .prove()
        .sign([deployerKey])
        .send();

      console.log('🎲 Random number generated:', randomNumber);

      console.log(
        '🔍 Determined parity (true=even, false=odd):',
        parity.toString()
      );

      // Fetch and display the result of the last guess
      const lastGuessResult = await zkAppInstance.lastGuessCorrect.get();
      console.log(
        `🎉 Your guess was: ${
          lastGuessResult.equals(Field(1)).toBoolean()
            ? '✅ Correct'
            : '❌ Incorrect'
        }`
      );

      rl.close();
    }
  );
}

main().catch(console.error);
