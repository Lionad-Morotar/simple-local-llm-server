# Load a model, start the server, and run this example in your terminal
# Choose between streaming and non-streaming mode by setting the "stream" field

curl http://localhost:14686/v1/chat/completions \
-H "Content-Type: application/json" \
-d '{ 
  "source_lang": "en",
  "target_lang": "zh",
  "text_list": [
    "I myself have been playing with a pnpm-style linker. It hasnt shipped yet since Im cautious about adding complexity that could end up unmaintained, but given how small it is theres a decent chance we could add it in a later release as an experimental install mode.",
    "Even for Yarn 1 users, migrating from 1 to 3 should be easier: we made it so that Yarn will detect when this situation arises to then automatically enable the {0} linker. That alone should address most of the problems you may have been hitting when attempting the upgrade - and for everything else, make sure to take a look at our Migration Guide which got significantly improved over the past year.",
    "hello, world!"
  ]
}'