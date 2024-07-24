import * as bitcoin from "bitcoinjs-lib";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";
import bip39 from "bip39";

const bip32 = BIP32Factory(ecc);
const wordlist = bip39.wordlists.english;

// Pull in environment variables from env file using ES Module syntax
import dotenv from "dotenv";
dotenv.config();

//get the mnemonic from the environment variables
console.log(process.env.MNEMONIC);
const mnemonicArray = process.env.MNEMONIC.split(" ");
const paths = JSON.parse(process.env.PATHS);
const passwords = JSON.parse(process.env.PASSWORDS);

// function getAddress(node, network) {
//   return bitcoin.payments.p2pkh({ pubkey: node.publicKey, network }).address;
// }

//create a function to get a segwit address
function getSegwitAddress(node, network) {
  return bitcoin.payments.p2wpkh({ pubkey: node.publicKey, network }).address;
}

//go through the whole list of words in wordlist array
//and replace each word with one word in the mnemonic array
//and check if the mnemonic is valid
let validMnemonics = [];
for (let index = 0; index < mnemonicArray.length; index++) {
  let cloned = Array.from(mnemonicArray);
  for (let i = 0; i < wordlist.length; i++) {
    cloned[index] = wordlist[i];
    const newMnemonic = cloned.join(" ");
    if (bip39.validateMnemonic(newMnemonic)) {
      console.log(newMnemonic);
      validMnemonics.push(newMnemonic);
    }
  }
}
console.log(`Found: ${validMnemonics.length} valid mnemonics`);
console.log(`Looking for address: ${process.env.FIND_ADDRESS}`);
//for each mnemonic in the array, get the first address
//and compare it to the johanAddress

console.log(`First, not using a password...`);

for (let index = 0; index < validMnemonics.length; index++) {
  const seed = bip39.mnemonicToSeedSync(validMnemonics[index]);
  const root = bip32.fromSeed(seed);
  paths.forEach((path) => {
    const address = getSegwitAddress(root.derivePath(path));
    if (address === process.env.FIND_ADDRESS) {
      console.log(`
        found!
        PATH: ${path}
        MNEMONIC: ${validMnemonics[index]}`);
    }
  });
}

//now do the same but for each password in the passwords array

for (let index = 0; index < passwords.length; index++) {
  console.log(`Using password: ${passwords[index]}`);
  for (let q = 0; q < validMnemonics.length; q++) {
    const seed = bip39.mnemonicToSeedSync(validMnemonics[q], passwords[index]);
    const root = bip32.fromSeed(seed);
    paths.forEach((path) => {
      const address = getSegwitAddress(root.derivePath(path));
      if (address === process.env.FIND_ADDRESS) {
        console.log(`
          found!
          PATH: ${path}
          PASSWORD: ${passwords[index]}
          MNEMONIC: ${validMnemonics[q]}`);
      }
    });
  }
}

console.log("done.");
