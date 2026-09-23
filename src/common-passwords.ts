/**
 * A small, bundled list of the most common passwords and password "base words".
 * Matching is case-insensitive and also catches simple variations
 * (trailing digits/symbols, a leading number, and common leet swaps),
 * so "Password123!", "P@ssw0rd" and "qwerty2024" are all caught.
 *
 * It is intentionally small (a few KB) — for full coverage, pair it with
 * `checkPwnedPassword` / `usePwnedPassword` (Have I Been Pwned).
 */
export const COMMON_PASSWORDS: readonly string[] = [
  // number sequences & repeats
  '123456', '1234567', '12345678', '123456789', '1234567890', '0123456789',
  '111111', '1111111', '11111111', '000000', '00000000', '123123', '123321',
  '654321', '666666', '777777', '7777777', '888888', '88888888', '999999',
  '121212', '112233', '123654', '987654321', '147258369', '159753', '12341234',
  '1q2w3e', '1q2w3e4r', '1q2w3e4r5t', '1qaz2wsx', '1qazxsw2', 'zaq12wsx',
  // keyboard walks
  'qwerty', 'qwertyu', 'qwertyuiop', 'qwe', 'qweasd', 'qweasdzxc', 'qwer', 'qazwsx',
  'asdf', 'asdfgh', 'asdfghjkl', 'zxcvbn', 'zxcvbnm', 'azerty', 'qwertz',
  'abc', 'abcd', 'abcde', 'abcdef', 'abcdefg', 'abcdefgh', 'aaaaaa',
  // the classics
  'password', 'pass', 'passwort', 'passpass', 'secret', 'letmein', 'welcome',
  'admin', 'administrator', 'root', 'login', 'user', 'guest', 'test', 'default',
  'changeme', 'access', 'master', 'trustno', 'whatever', 'nothing', 'unknown',
  'iloveyou', 'loveme', 'love', 'lovely', 'hello', 'hellokitty', 'freedom',
  'monkey', 'dragon', 'shadow', 'sunshine', 'princess', 'superman', 'batman',
  'spiderman', 'starwars', 'pokemon', 'naruto', 'matrix', 'ninja', 'killer',
  'football', 'baseball', 'basketball', 'soccer', 'hockey', 'golf', 'tennis',
  'liverpool', 'arsenal', 'chelsea', 'barcelona', 'realmadrid', 'juventus',
  'mustang', 'ferrari', 'porsche', 'harley', 'corvette', 'mercedes',
  'computer', 'internet', 'google', 'apple', 'samsung', 'facebook', 'linkedin',
  'myspace', 'youtube', 'twitter', 'instagram', 'microsoft', 'windows',
  'summer', 'winter', 'spring', 'autumn', 'monday', 'friday', 'sunday',
  'flower', 'cheese', 'cookie', 'chocolate', 'pepper', 'ginger', 'banana',
  'orange', 'purple', 'silver', 'golden', 'diamond', 'money', 'angel',
  'michael', 'jennifer', 'jessica', 'ashley', 'jordan', 'hunter', 'ranger',
  'buster', 'tigger', 'charlie', 'robert', 'thomas', 'daniel', 'andrew',
  'joshua', 'maggie', 'bailey', 'matthew', 'anthony',
];
