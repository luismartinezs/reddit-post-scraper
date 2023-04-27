import os
from datetime import datetime
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lex_rank import LexRankSummarizer

def extractive_summarization(text, summary_length=10):
    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    summarizer = LexRankSummarizer()
    summarized_sentences = summarizer(parser.document, summary_length)

    summary = " ".join([str(sentence) for sentence in summarized_sentences])
    return summary

input_filename = 'formatted/2023-04-27T20-44-59-262Z.txt'

with open(input_filename, 'r', encoding='utf-8') as file:
    content = file.read()

summary = extractive_summarization(content, summary_length=10)

output_folder = 'extracted-summaries'
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

timestamp = datetime.now().strftime('%Y-%m-%dT%H-%M-%S')
output_filename = f'{timestamp}.txt'
output_path = os.path.join(output_folder, output_filename)

with open(output_path, 'w', encoding='utf-8') as output_file:
    output_file.write(summary)

print(f'Summary saved to {output_path}')
