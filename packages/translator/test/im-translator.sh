# Load a model, start the server, and run this example in your terminal
# Choose between streaming and non-streaming mode by setting the "stream" field

curl http://localhost:14686/v1/chat/completions \
-H "Content-Type: application/json" \
-d '{ 
  "source_lang": "en",
  "target_lang": "zh",
  "text_list": ["These little question-marked rascals that hang out at the end of your web addresses, casually sipping on ampersands, hold the power to modify, track, and even amuse your web pages."]
}'