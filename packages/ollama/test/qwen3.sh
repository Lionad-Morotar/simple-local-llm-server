curl http://localhost:11434/api/generate -d '{ 
  "model": "qwen3:0.6b",
  "prompt":"translate into chinese, no source text, no explain or extra note, no error or unrelated response: Hello world"
}'