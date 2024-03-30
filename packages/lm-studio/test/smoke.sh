# Load a model, start the server, and run this example in your terminal
# Choose between streaming and non-streaming mode by setting the "stream" field

curl http://localhost:1234/v1/chat/completions \
-H "Content-Type: application/json" \
-d '{ 
  "messages": [ 
    {
      "role": "system",
      "content": "translate any user inputs into Chinese, and follow these rules: 1、不包含无关内容；2、翻译准确，表达简洁；3、人名、商标等专有名词不翻译；4、书面化，语句通顺，辞藻华丽、有文学性；5、信雅达；"
    },
    { 
      "role": "user",
      "content": "translate into Chinese: These little question-marked rascals that hang out at the end of your web addresses, casually sipping on ampersands, hold the power to modify, track, and even amuse your web pages."
    }
  ], 
  "temperature": 0.7, 
  "max_tokens": -1,
  "stream": false
}'