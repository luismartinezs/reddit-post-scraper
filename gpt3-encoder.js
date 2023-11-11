const {encode, decode} = require('gpt-3-encoder')

const str = `A helpful rule of thumb is that one token generally corresponds to ~4 characters of text for common English text. This translates to roughly ¾ of a word (so 100 tokens ~= 75 words).
If you need a programmatic interface for tokenizing text, check out our tiktoken package for Python. For JavaScript, the gpt-3-encoder package for node.js works for most GPT-3 models.`
const encoded = encode(str)
console.log('Encoded this string looks like: ', encoded)

console.log('We can look at each token and what it represents')
for(let token of encoded){
  console.log({token, string: decode([token])})
}

const decoded = decode(encoded)
console.log('We can decode it back into:\n', decoded)