curl http://localhost:11434/api/generate -d '{ 
  "model": "qwen:0.5b",
  "prompt":"translate into chinese, no source text, no explain or extra note, no error or unrelated response: Hello world"
}'