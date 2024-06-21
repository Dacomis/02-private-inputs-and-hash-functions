import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Bool,
  Provable,
} from 'o1js';

export class GuessGame extends SmartContract {
  @state(Field) lastGuessCorrect = State<Field>();
  @state(Bool) lastNumberParity = State<Bool>(); // true for even, false for odd

  @method async initGame(parity: Bool) {
    this.lastNumberParity.set(parity);
  }

  @method async makeGuess(userGuess: Bool) {
    const actualParity = this.lastNumberParity.get();
    this.lastNumberParity.requireEquals(actualParity); // Ensure no state change

    const result = Provable.if(
      userGuess.equals(actualParity),
      Field(1), // Guess is correct
      Field(0) // Guess is incorrect
    );

    this.lastGuessCorrect.set(result);
  }
}
